import fs from 'fs';
import path from 'path';
import { Place, PathNode, PathSegment, RouteIssue } from '../../types/campus';
import { INITIAL_PLACES, INITIAL_PATH_NODES, INITIAL_PATH_SEGMENTS } from '../../data/campusData';

interface DbStore {
  places: Place[];
  pathNodes: PathNode[];
  pathSegments: PathSegment[];
  reports: RouteIssue[];
  lastUpdated: string;
}

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db_store.json');

function getDefaultStore(): DbStore {
  return {
    places: JSON.parse(JSON.stringify(INITIAL_PLACES)),
    pathNodes: JSON.parse(JSON.stringify(INITIAL_PATH_NODES)),
    pathSegments: JSON.parse(JSON.stringify(INITIAL_PATH_SEGMENTS)),
    reports: [
      {
        id: 'rep-demo-01',
        placeId: 'place-canteen',
        placeName: 'University Canteen',
        issueType: 'WRONG_DIRECTIONS',
        description: 'New pedestrian shade structure added on west walkway entrance.',
        userContact: 'student.rep@au.edu.in',
        status: 'PENDING',
        createdAt: '2026-10-14T08:30:00Z',
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

let memoryStore: DbStore | null = null;

function loadStore(): DbStore {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      memoryStore = JSON.parse(data);
      return memoryStore!;
    }
  } catch (err) {
    console.error('Error reading db_store.json, using defaults:', err);
  }

  memoryStore = getDefaultStore();
  saveStore(memoryStore);
  return memoryStore;
}

function saveStore(store: DbStore): void {
  memoryStore = store;
  store.lastUpdated = new Date().toISOString();
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store to disk:', err);
  }
}

// Places CRUD
export function getPlaces(): Place[] {
  return loadStore().places;
}

export function getPlaceById(id: string): Place | undefined {
  return loadStore().places.find((p) => p.id === id);
}

export function savePlace(place: Place): Place {
  const store = loadStore();
  const index = store.places.findIndex((p) => p.id === place.id);
  place.updatedAt = new Date().toISOString();

  if (index >= 0) {
    store.places[index] = place;
  } else {
    store.places.push(place);
  }
  saveStore(store);
  return place;
}

export function deletePlace(id: string): boolean {
  const store = loadStore();
  const initialLen = store.places.length;
  store.places = store.places.filter((p) => p.id !== id);
  if (store.places.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// Path Nodes CRUD
export function getPathNodes(): PathNode[] {
  return loadStore().pathNodes;
}

export function savePathNode(node: PathNode): PathNode {
  const store = loadStore();
  const index = store.pathNodes.findIndex((n) => n.id === node.id);
  if (index >= 0) {
    store.pathNodes[index] = node;
  } else {
    store.pathNodes.push(node);
  }
  saveStore(store);
  return node;
}

export function deletePathNode(id: string): boolean {
  const store = loadStore();
  const initialLen = store.pathNodes.length;
  store.pathNodes = store.pathNodes.filter((n) => n.id !== id);
  // Also remove segments connected to this node
  store.pathSegments = store.pathSegments.filter(
    (s) => s.startNodeId !== id && s.endNodeId !== id
  );
  if (store.pathNodes.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// Path Segments CRUD
export function getPathSegments(): PathSegment[] {
  return loadStore().pathSegments;
}

export function savePathSegment(segment: PathSegment): PathSegment {
  const store = loadStore();
  const index = store.pathSegments.findIndex((s) => s.id === segment.id);
  if (index >= 0) {
    store.pathSegments[index] = segment;
  } else {
    store.pathSegments.push(segment);
  }
  saveStore(store);
  return segment;
}

export function deletePathSegment(id: string): boolean {
  const store = loadStore();
  const initialLen = store.pathSegments.length;
  store.pathSegments = store.pathSegments.filter((s) => s.id !== id);
  if (store.pathSegments.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// User Issue Reports
export function getReports(): RouteIssue[] {
  return loadStore().reports;
}

export function addReport(report: Omit<RouteIssue, 'id' | 'createdAt'>): RouteIssue {
  const store = loadStore();
  const newReport: RouteIssue = {
    ...report,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.reports.unshift(newReport);
  saveStore(store);
  return newReport;
}

export function updateReportStatus(id: string, status: RouteIssue['status']): boolean {
  const store = loadStore();
  const rep = store.reports.find((r) => r.id === id);
  if (rep) {
    rep.status = status;
    saveStore(store);
    return true;
  }
  return false;
}

// Reset data
export function resetDatabase(): void {
  const defaultStore = getDefaultStore();
  saveStore(defaultStore);
}
