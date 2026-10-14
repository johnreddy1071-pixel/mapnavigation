export type CampusPlaceCategory =
  | 'ACADEMIC'
  | 'CANTEEN'
  | 'LIBRARY'
  | 'AUDITORIUM'
  | 'HOSTEL'
  | 'ADMINISTRATION'
  | 'PARKING'
  | 'SPORTS'
  | 'MEDICAL'
  | 'ENTRANCE'
  | 'FACILITY';

export type VerificationStatus = 'VERIFIED' | 'AWAITING_VERIFICATION' | 'DEMO_BENCHMARK';

export type AccessStatus = 'OPEN' | 'TEMPORARILY_CLOSED' | 'RESTRICTED';

export type WayType = 'PAVED_WALKWAY' | 'MAIN_ROAD' | 'CORRIDOR' | 'RAMP' | 'STAIRS';

export interface Place {
  id: string;
  name: string;
  normalizedName: string;
  code?: string;
  category: CampusPlaceCategory;
  description: string;
  latitude: number;
  longitude: number;
  buildingId?: string;
  floorInfo?: string;
  facilities: string[];
  verificationStatus: VerificationStatus;
  publicationStatus: 'PUBLISHED' | 'DRAFT';
  aliases: string[];
  tags: string[];
  openingHours?: string;
  wheelchairAccessible: boolean;
  contactPhone?: string;
  entranceNodeId?: string;
  updatedAt: string;
}

export interface PathNode {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  nodeType: 'ENTRANCE' | 'JUNCTION' | 'WALKWAY' | 'LANDMARK';
  verificationStatus: VerificationStatus;
  connectedPlaceId?: string;
}

export interface PathSegment {
  id: string;
  startNodeId: string;
  endNodeId: string;
  distanceMeters: number;
  isAccessible: boolean;
  accessStatus: AccessStatus;
  wayType: WayType;
  verificationStatus: VerificationStatus;
  instruction?: string;
}

export interface RouteStep {
  stepNumber: number;
  instruction: string;
  distanceMeters: number;
  estimatedSeconds: number;
  startCoord: [number, number];
  endCoord: [number, number];
  bearing: string;
  landmark?: string;
  turnType: 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right' | 'u_turn' | 'arrive';
}

export interface RouteResult {
  found: boolean;
  nodes: PathNode[];
  segments: PathSegment[];
  coordinates: [number, number][];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  steps: RouteStep[];
  isFullyVerified: boolean;
  warningMessage?: string;
  errorReason?: string;
}

export interface RouteIssue {
  id: string;
  placeId?: string;
  pathSegmentId?: string;
  placeName?: string;
  issueType: 'INCORRECT_POSITION' | 'MISSING_LOCATION' | 'INCORRECT_NAME' | 'BLOCKED_WALKWAY' | 'WRONG_DIRECTIONS' | 'OTHER';
  description: string;
  userContact?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  createdAt: string;
}

export interface CampusMeta {
  id: string;
  name: string;
  shortName: string;
  address: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  boundaryPolygon: [number, number][];
  officialWebsite: string;
  contactEmail: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  routeData?: RouteResult;
  suggestedPlaces?: Place[];
  actionPrompt?: string;
  isGrounded: boolean;
}
