import { PathNode, PathSegment, RouteResult, RouteStep, Place } from '../../types/campus';

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine formula).
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates geographic bearing in degrees from point 1 to point 2 (0-360).
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

/**
 * Converts degree bearing into turn type descriptor.
 */
function getTurnType(deltaDeg: number): RouteStep['turnType'] {
  const diff = ((deltaDeg % 360) + 360) % 360;
  if (diff <= 25 || diff >= 335) return 'straight';
  if (diff > 25 && diff < 65) return 'slight_right';
  if (diff >= 65 && diff <= 135) return 'right';
  if (diff > 135 && diff < 225) return 'u_turn';
  if (diff >= 225 && diff < 295) return 'left';
  return 'slight_left';
}

/**
 * Finds the nearest PathNode to given coordinates.
 */
export function findNearestNode(
  lat: number,
  lng: number,
  nodes: PathNode[],
  maxDistanceMeters = 350
): { node: PathNode; distance: number } | null {
  let nearest: PathNode | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const dist = calculateDistance(lat, lng, node.latitude, node.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = node;
    }
  }

  if (nearest && minDistance <= maxDistanceMeters) {
    return { node: nearest, distance: minDistance };
  }
  return null;
}

interface GraphEdge {
  targetNodeId: string;
  segment: PathSegment;
  weight: number;
}

/**
 * Core Campus Shortest Path Router using Dijkstra / A*
 */
export function findCampusRoute(
  startNodeId: string,
  endNodeId: string,
  nodes: PathNode[],
  segments: PathSegment[],
  options: {
    requireAccessible?: boolean;
    avoidTemporaryClosures?: boolean;
  } = {}
): RouteResult {
  const { requireAccessible = false, avoidTemporaryClosures = true } = options;

  const nodeMap = new Map<string, PathNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const startNode = nodeMap.get(startNodeId);
  const endNode = nodeMap.get(endNodeId);

  if (!startNode || !endNode) {
    return {
      found: false,
      nodes: [],
      segments: [],
      coordinates: [],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      steps: [],
      isFullyVerified: false,
      errorReason: 'Start or end node was not found in the verified campus graph.',
    };
  }

  if (startNodeId === endNodeId) {
    return {
      found: true,
      nodes: [startNode],
      segments: [],
      coordinates: [[startNode.latitude, startNode.longitude]],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      steps: [
        {
          stepNumber: 1,
          instruction: `You are already at ${startNode.label}.`,
          distanceMeters: 0,
          estimatedSeconds: 0,
          startCoord: [startNode.latitude, startNode.longitude],
          endCoord: [startNode.latitude, startNode.longitude],
          bearing: '0°',
          landmark: startNode.label,
          turnType: 'arrive',
        },
      ],
      isFullyVerified: startNode.verificationStatus === 'VERIFIED',
    };
  }

  // Build Adjacency List (Bi-directional)
  const adjacency = new Map<string, GraphEdge[]>();
  nodes.forEach((n) => adjacency.set(n.id, []));

  segments.forEach((seg) => {
    if (avoidTemporaryClosures && seg.accessStatus === 'TEMPORARILY_CLOSED') return;
    if (requireAccessible && (!seg.isAccessible || seg.wayType === 'STAIRS')) return;

    const u = seg.startNodeId;
    const v = seg.endNodeId;
    const weight = seg.distanceMeters > 0 ? seg.distanceMeters : 1;

    if (adjacency.has(u) && adjacency.has(v)) {
      adjacency.get(u)!.push({ targetNodeId: v, segment: seg, weight });
      adjacency.get(v)!.push({ targetNodeId: u, segment: seg, weight });
    }
  });

  // Dijkstra Algorithm
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; segment: PathSegment }>();
  const unvisited = new Set<string>();

  nodes.forEach((n) => {
    distances.set(n.id, Infinity);
    unvisited.add(n.id);
  });
  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    // Extract node with minimum distance
    let currentId: string | null = null;
    let minD = Infinity;
    unvisited.forEach((id) => {
      const d = distances.get(id)!;
      if (d < minD) {
        minD = d;
        currentId = id;
      }
    });

    if (currentId === null || minD === Infinity) break;
    if (currentId === endNodeId) break;

    unvisited.delete(currentId);

    const edges = adjacency.get(currentId) || [];
    for (const edge of edges) {
      if (!unvisited.has(edge.targetNodeId)) continue;
      const alt = minD + edge.weight;
      if (alt < distances.get(edge.targetNodeId)!) {
        distances.set(edge.targetNodeId, alt);
        previous.set(edge.targetNodeId, { nodeId: currentId, segment: edge.segment });
      }
    }
  }

  // Reconstruct path
  if (!previous.has(endNodeId) && startNodeId !== endNodeId) {
    return {
      found: false,
      nodes: [],
      segments: [],
      coordinates: [],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      steps: [],
      isFullyVerified: false,
      errorReason: 'No connected walking path found between these campus locations. Check if a path section is closed or awaiting ground survey.',
    };
  }

  const pathNodeIds: string[] = [];
  const pathSegments: PathSegment[] = [];
  let curr: string | undefined = endNodeId;

  while (curr && curr !== startNodeId) {
    pathNodeIds.unshift(curr);
    const prevEntry = previous.get(curr);
    if (!prevEntry) break;
    pathSegments.unshift(prevEntry.segment);
    curr = prevEntry.nodeId;
  }
  pathNodeIds.unshift(startNodeId);

  const pathNodes = pathNodeIds.map((id) => nodeMap.get(id)!);
  const coordinates: [number, number][] = pathNodes.map((n) => [n.latitude, n.longitude]);

  // Calculate Metrics
  const totalDistanceMeters = pathSegments.reduce((sum, s) => sum + s.distanceMeters, 0);
  const walkingSpeedMetersPerMin = 75; // ~4.5 km/h
  const estimatedMinutes = Math.max(1, Math.round(totalDistanceMeters / walkingSpeedMetersPerMin));

  // Generate Turn-by-Turn Steps
  const steps: RouteStep[] = [];
  let prevBearing: number | null = null;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const fromNode = pathNodes[i];
    const toNode = pathNodes[i + 1];
    const seg = pathSegments[i];
    const currentBearing = calculateBearing(
      fromNode.latitude,
      fromNode.longitude,
      toNode.latitude,
      toNode.longitude
    );

    let turnType: RouteStep['turnType'] = 'straight';
    let turnDescription = '';

    if (i === 0) {
      turnDescription = `Start walking from ${fromNode.label} along ${seg.wayType.toLowerCase().replace('_', ' ')}.`;
      turnType = 'straight';
    } else if (prevBearing !== null) {
      const delta = (currentBearing - prevBearing + 360) % 360;
      turnType = getTurnType(delta);

      if (turnType === 'straight') {
        turnDescription = `Continue straight past ${fromNode.label}.`;
      } else if (turnType === 'slight_right') {
        turnDescription = `Bear slightly right near ${fromNode.label}.`;
      } else if (turnType === 'right') {
        turnDescription = `Turn right near ${fromNode.label}.`;
      } else if (turnType === 'slight_left') {
        turnDescription = `Bear slightly left near ${fromNode.label}.`;
      } else if (turnType === 'left') {
        turnDescription = `Turn left near ${fromNode.label}.`;
      } else {
        turnDescription = `Follow walkway curvature near ${fromNode.label}.`;
      }
    }

    const customInstruction = seg.instruction ? ` ${seg.instruction}` : '';

    steps.push({
      stepNumber: i + 1,
      instruction: `${turnDescription}${customInstruction}`,
      distanceMeters: seg.distanceMeters,
      estimatedSeconds: Math.round((seg.distanceMeters / walkingSpeedMetersPerMin) * 60),
      startCoord: [fromNode.latitude, fromNode.longitude],
      endCoord: [toNode.latitude, toNode.longitude],
      bearing: `${Math.round(currentBearing)}°`,
      landmark: fromNode.label,
      turnType,
    });

    prevBearing = currentBearing;
  }

  // Final destination arrival step
  const finalNode = pathNodes[pathNodes.length - 1];
  steps.push({
    stepNumber: steps.length + 1,
    instruction: `Arrive at your destination: ${finalNode.label}.`,
    distanceMeters: 0,
    estimatedSeconds: 0,
    startCoord: [finalNode.latitude, finalNode.longitude],
    endCoord: [finalNode.latitude, finalNode.longitude],
    bearing: '0°',
    landmark: finalNode.label,
    turnType: 'arrive',
  });

  const isFullyVerified =
    pathNodes.every((n) => n.verificationStatus === 'VERIFIED') &&
    pathSegments.every((s) => s.verificationStatus === 'VERIFIED');

  const warningMessage = !isFullyVerified
    ? 'Portions of this route include locations or walkways awaiting on-site GPS verification.'
    : undefined;

  return {
    found: true,
    nodes: pathNodes,
    segments: pathSegments,
    coordinates,
    totalDistanceMeters,
    estimatedMinutes,
    steps,
    isFullyVerified,
    warningMessage,
  };
}

/**
 * High-level function to route between two Places or arbitrary coordinates
 */
export function routeBetweenPlaces(
  startPlace: Place,
  destinationPlace: Place,
  nodes: PathNode[],
  segments: PathSegment[],
  options?: { requireAccessible?: boolean; avoidTemporaryClosures?: boolean }
): RouteResult {
  const startNodeId = startPlace.entranceNodeId || findNearestNode(startPlace.latitude, startPlace.longitude, nodes)?.node.id;
  const destNodeId = destinationPlace.entranceNodeId || findNearestNode(destinationPlace.latitude, destinationPlace.longitude, nodes)?.node.id;

  if (!startNodeId || !destNodeId) {
    return {
      found: false,
      nodes: [],
      segments: [],
      coordinates: [],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      steps: [],
      isFullyVerified: false,
      errorReason: 'Could not connect one or both locations to the verified campus walkway network.',
    };
  }

  return findCampusRoute(startNodeId, destNodeId, nodes, segments, options);
}
