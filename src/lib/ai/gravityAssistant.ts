import { Place, PathNode, PathSegment, RouteResult, ChatMessage } from '../../types/campus';
import { searchPlaces } from '../search/searchService';
import { routeBetweenPlaces, findCampusRoute, findNearestNode } from '../routing/engine';

interface AssistantContext {
  places: Place[];
  nodes: PathNode[];
  segments: PathSegment[];
  userLocation?: [number, number] | null;
}

interface AssistantResponse {
  reply: string;
  routeData?: RouteResult;
  suggestedPlaces?: Place[];
  actionPrompt?: string;
  isGrounded: boolean;
}

/**
 * Intelligent campus assistant that resolves queries strictly against verified database
 * and calculates genuine walking routes via the graph routing engine.
 */
export async function processGravityAssistantQuery(
  userQuery: string,
  context: AssistantContext
): Promise<AssistantResponse> {
  const { places, nodes, segments, userLocation } = context;
  const q = userQuery.trim().toLowerCase();

  // 1. Navigation / Route Intent: "how do I get to X from Y", "from X to Y", "navigate from X to Y"
  const fromToRegex = /(?:from|starting from|at|near)\s+([a-z0-9\s&'-]+?)\s+(?:to|reach|go to|take me to|navigate to)\s+([a-z0-9\s&'-]+)/i;
  const toFromRegex = /(?:how (?:do i|to) (?:reach|get to)|navigate to|route to|take me to)\s+([a-z0-9\s&'-]+?)\s+(?:from|starting from|starting at)\s+([a-z0-9\s&'-]+)/i;
  
  let originQuery = '';
  let destQuery = '';

  const matchFromTo = q.match(fromToRegex);
  const matchToFrom = q.match(toFromRegex);

  if (matchToFrom) {
    destQuery = matchToFrom[1].trim();
    originQuery = matchToFrom[2].trim();
  } else if (matchFromTo) {
    originQuery = matchFromTo[1].trim();
    destQuery = matchFromTo[2].trim();
  }

  if (originQuery && destQuery) {
    // Resolve both places
    const originResults = searchPlaces(originQuery, places);
    const destResults = searchPlaces(destQuery, places);

    if (originResults.length > 0 && destResults.length > 0) {
      const startPlace = originResults[0].place;
      const targetPlace = destResults[0].place;

      const route = routeBetweenPlaces(startPlace, targetPlace, nodes, segments);
      if (route.found) {
        return {
          reply: `Here is the verified walking route from **${startPlace.name}** to **${targetPlace.name}**.\n\n` +
            `• **Distance:** ${route.totalDistanceMeters} meters\n` +
            `• **Estimated Walking Time:** ~${route.estimatedMinutes} min\n` +
            `• **Path Status:** ${route.isFullyVerified ? 'Verified Campus Walkways' : 'Includes sections pending GPS confirmation'}\n\n` +
            `Follow the highlighted blue route on the map or expand the step-by-step directions drawer below.`,
          routeData: route,
          suggestedPlaces: [startPlace, targetPlace],
          actionPrompt: `View route to ${targetPlace.name}`,
          isGrounded: true,
        };
      } else {
        return {
          reply: `I located **${startPlace.name}** and **${targetPlace.name}**, but could not find a verified open walkway connecting them in our database. ${route.errorReason || ''}\n\nWould you like directions from the Main Highway Gate instead?`,
          suggestedPlaces: [startPlace, targetPlace],
          isGrounded: true,
        };
      }
    }
  }

  // 2. Classroom & Room number inquiries (e.g. "where is room 101", "cannot find my classroom")
  if (
    q.match(/room\s+\d+/i) ||
    q.includes('my classroom') ||
    q.includes('find my classroom') ||
    q.includes('which room') ||
    q.includes('where is my class') ||
    q.includes('cannot find my class')
  ) {
    return {
      reply: `To guide you to the exact classroom or laboratory, please specify:\n\n` +
        `1. **Department or Program** (e.g., CSE, AIDS, AIML, Mechanical, Civil, ECE, EEE, MBA, MCA, Pharmacy)\n` +
        `2. **Target Academic Block** (e.g., Main Block, PG Block, AIML Block, Mech Block)\n` +
        `3. **Floor or Room Number** (e.g., 1st Floor, CAD Lab, Seminar Hall)\n\n` +
        `*Note: AI Gravity strictly avoids guessing unmapped classroom numbers to guarantee student safety and navigation accuracy.*`,
      suggestedPlaces: places.filter((p) => p.category === 'ACADEMIC').slice(0, 4),
      isGrounded: true,
    };
  }

  // 3. Single destination query: "where is the canteen", "take me to library", "how do I reach aiml"
  const singleDestRegex = /(?:where is|where's|find|how do i get to|how to reach|take me to|navigate to|look for|show me)\s+(?:the\s+)?([a-z0-9\s&'-]+)/i;
  const singleMatch = q.match(singleDestRegex);
  const targetName = singleMatch ? singleMatch[1].trim() : q;

  const searchHits = searchPlaces(targetName, places);

  if (searchHits.length > 0) {
    const primary = searchHits[0].place;

    // If user's GPS is available and inside/near campus, offer route from current location!
    let routeFromGps: RouteResult | undefined;
    if (userLocation) {
      const nearestToGps = findNearestNode(userLocation[0], userLocation[1], nodes, 400);
      const destNodeId = primary.entranceNodeId || findNearestNode(primary.latitude, primary.longitude, nodes)?.node.id;

      if (nearestToGps && destNodeId) {
        routeFromGps = findCampusRoute(nearestToGps.node.id, destNodeId, nodes, segments);
      }
    }

    // Default route from Main Gate for demonstration / convenience
    const mainGate = places.find((p) => p.id === 'place-main-gate');
    let routeFromGate: RouteResult | undefined;
    if (mainGate && mainGate.id !== primary.id) {
      routeFromGate = routeBetweenPlaces(mainGate, primary, nodes, segments);
    }

    const activeRoute = (routeFromGps && routeFromGps.found) ? routeFromGps : (routeFromGate && routeFromGate.found ? routeFromGate : undefined);

    let verificationNote = '';
    if (primary.verificationStatus === 'VERIFIED') {
      verificationNote = '✅ This location has been verified with verified campus GPS coordinates.';
    } else {
      verificationNote = '⚠️ This location is awaiting on-site GPS verification by university staff.';
    }

    let facilitiesText = '';
    if (primary.facilities.length > 0) {
      facilitiesText = `\n**Key Facilities:**\n${primary.facilities.map((f) => `• ${f}`).join('\n')}`;
    }

    let floorText = primary.floorInfo ? `\n**Floor & Layout:** ${primary.floorInfo}` : '';

    return {
      reply: `**${primary.name}** (${primary.code || primary.category})\n\n` +
        `${primary.description}\n` +
        `${floorText}` +
        `${facilitiesText}\n\n` +
        `${verificationNote}\n\n` +
        (activeRoute && activeRoute.found
          ? `I've prepared walking directions (${activeRoute.totalDistanceMeters}m, ~${activeRoute.estimatedMinutes} min walking). Tap **Start Navigation** to follow the route!`
          : `Coordinates: [${primary.latitude.toFixed(5)}, ${primary.longitude.toFixed(5)}]`),
      routeData: activeRoute,
      suggestedPlaces: [primary],
      actionPrompt: `Navigate to ${primary.name}`,
      isGrounded: true,
    };
  }

  // 3. "What places are near me?" / Nearby query
  if (q.includes('near me') || q.includes('nearby') || q.includes('around here')) {
    if (userLocation) {
      const sortedByDistance = places
        .map((p) => ({
          place: p,
          dist: Math.round(
            Math.sqrt(
              Math.pow((p.latitude - userLocation[0]) * 111320, 2) +
                Math.pow((p.longitude - userLocation[1]) * 111320 * Math.cos(userLocation[0] * (Math.PI / 180)), 2)
            )
          ),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      return {
        reply: `Here are the closest verified facilities to your current GPS position:\n\n` +
          sortedByDistance
            .map((item, idx) => `${idx + 1}. **${item.place.name}** (~${item.dist} meters away) - *${item.place.category}*`)
            .join('\n\n') +
          `\n\nTap any place on the map to view details or start walking directions.`,
        suggestedPlaces: sortedByDistance.map((item) => item.place),
        isGrounded: true,
      };
    } else {
      return {
        reply: `To show nearby facilities, please enable GPS location access using the **My Location** button on the map, or select a campus reference point like the Main Gate or Main Block.`,
        suggestedPlaces: places.slice(0, 4),
        isGrounded: true,
      };
    }
  }

  // 4. Classroom / Room inquiry: "cannot find my classroom", "room number"
  if (q.includes('classroom') || q.includes('room') || q.includes('lab') || q.includes('section')) {
    return {
      reply: `To guide you to the exact classroom or laboratory, please specify:\n\n` +
        `1. **Department or Program** (e.g., CSE, AIDS, AIML, Mechanical, Civil, ECE, EEE, MBA, MCA, Pharmacy)\n` +
        `2. **Target Academic Block** (e.g., Main Block, PG Block, AIML Block, Mech Block)\n` +
        `3. **Room or Floor Number** (e.g., 2nd Floor, Seminar Hall, VLSI Lab)\n\n` +
        `*Note: AI Gravity strictly avoids guessing unmapped classroom numbers to guarantee student safety and navigation accuracy.*`,
      suggestedPlaces: places.filter((p) => p.category === 'ACADEMIC').slice(0, 4),
      isGrounded: true,
    };
  }

  // 5. General University query fallback
  return {
    reply: `I am **Gravity AI**, your digital guide for **Annamacharya University, Rajampet**.\n\n` +
      `You can ask me things like:\n` +
      `• *"Where is the Canteen?"*\n` +
      `• *"How do I reach the Library from the Main Gate?"*\n` +
      `• *"Where is the AIML Block?"*\n` +
      `• *"Take me to the Cricket Ground"*\n` +
      `• *"What places are near me?"*\n\n` +
      `All answers are grounded in our verified campus database and pedestrian walkway network.`,
    suggestedPlaces: places.slice(0, 4),
    isGrounded: true,
  };
}
