import assert from 'assert';
import { INITIAL_PLACES, INITIAL_PATH_NODES, INITIAL_PATH_SEGMENTS } from '../src/data/campusData.js';
import { searchPlaces } from '../src/lib/search/searchService.js';
import { findCampusRoute, routeBetweenPlaces, calculateDistance } from '../src/lib/routing/engine.js';
import { processGravityAssistantQuery } from '../src/lib/ai/gravityAssistant.js';

console.log('🧪 Starting AI Gravity QA Verification Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

// 1. Search for Main Block
runTest('Search: Main Block retrieval', () => {
  const results = searchPlaces('Main Block', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.name.includes('Main Block'), `Expected Main Block, got ${results[0].place.name}`);
});

// 2. Search for Canteen
runTest('Search: Canteen retrieval', () => {
  const results = searchPlaces('canteen', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.name.toLowerCase().includes('canteen'), `Expected Canteen, got ${results[0].place.name}`);
});

// 3. Search for Central Library
runTest('Search: Library retrieval', () => {
  const results = searchPlaces('library', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.name.toLowerCase().includes('library'), `Expected Library, got ${results[0].place.name}`);
});

// 4. Search for Department blocks
runTest('Search: AIML Block retrieval', () => {
  const results = searchPlaces('AIML Block', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.code === 'AIML-01', `Expected AIML-01, got ${results[0].place.code}`);
});

// 5. Misspelled place names (Fuzzy Levenshtein matching)
runTest('Search: Misspelled "cantin" finds Canteen', () => {
  const results = searchPlaces('cantin', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.name.toLowerCase().includes('canteen'), `Expected Canteen, got ${results[0].place.name}`);
});

runTest('Search: Misspelled "libary" finds Library', () => {
  const results = searchPlaces('libary', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.name.toLowerCase().includes('library'), `Expected Library, got ${results[0].place.name}`);
});

// 6. Synonym matching: "mess" -> Canteen, "gym" -> Open Gym, "cricket" -> Cricket Ground
runTest('Search: Synonym "mess" retrieves University Canteen', () => {
  const results = searchPlaces('mess', INITIAL_PLACES);
  assert(results.length > 0, 'Results should not be empty');
  assert(results[0].place.id === 'place-canteen', `Expected place-canteen, got ${results[0].place.id}`);
});

// 7. Walking Route: Highway Entrance to University Canteen
runTest('Routing: Main Gate to Canteen shortest path', () => {
  const mainGate = INITIAL_PLACES.find((p) => p.id === 'place-main-gate');
  const canteen = INITIAL_PLACES.find((p) => p.id === 'place-canteen');
  assert(mainGate && canteen, 'Places must exist');

  const route = routeBetweenPlaces(mainGate, canteen, INITIAL_PATH_NODES, INITIAL_PATH_SEGMENTS);
  assert(route.found === true, 'Route must be found');
  assert(route.totalDistanceMeters > 200 && route.totalDistanceMeters < 800, `Expected distance 200-800m, got ${route.totalDistanceMeters}m`);
  assert(route.estimatedMinutes >= 3 && route.estimatedMinutes <= 10, `Expected 3-10 min, got ${route.estimatedMinutes} min`);
  assert(route.steps.length >= 3, 'Steps should contain turn-by-turn instructions');
  assert(route.steps[route.steps.length - 1].turnType === 'arrive', 'Last step must be arrival');
});

// 8. Route: PG Block to Central Library
runTest('Routing: PG Block to Library', () => {
  const pgBlock = INITIAL_PLACES.find((p) => p.id === 'place-pg-block');
  const library = INITIAL_PLACES.find((p) => p.id === 'place-central-library');
  const route = routeBetweenPlaces(pgBlock, library, INITIAL_PATH_NODES, INITIAL_PATH_SEGMENTS);
  assert(route.found === true, 'Route must be found');
  assert(route.totalDistanceMeters > 0, 'Distance must be > 0');
});

// 9. Disconnected Path Handling
runTest('Routing: Disconnected isolated node fails safely without fabricating line', () => {
  const isolatedNode = {
    id: 'node-isolated-test',
    label: 'Isolated Island Node',
    latitude: 14.2299,
    longitude: 79.1450,
    nodeType: 'WALKWAY',
    verificationStatus: 'AWAITING_VERIFICATION',
  };
  const testNodes = [...INITIAL_PATH_NODES, isolatedNode];
  const route = findCampusRoute('node-gate-main', 'node-isolated-test', testNodes, INITIAL_PATH_SEGMENTS);
  assert(route.found === false, 'Route to disconnected node must return found: false');
  assert(route.errorReason && route.errorReason.length > 0, 'Must provide clear error reason');
});

// 10. AI Assistant Query Execution
await runAsyncTest('Gravity AI: Natural language "Where is the canteen?"', async () => {
  const res = await processGravityAssistantQuery('Where is the canteen?', {
    places: INITIAL_PLACES,
    nodes: INITIAL_PATH_NODES,
    segments: INITIAL_PATH_SEGMENTS,
  });
  assert(res.isGrounded === true, 'Response must be grounded in campus database');
  assert(res.reply.toLowerCase().includes('canteen') || res.reply.toLowerCase().includes('cafeteria'), 'Must mention canteen');
  assert(res.routeData && res.routeData.found === true, 'Should include walking route');
});

await runAsyncTest('Gravity AI: Natural language "from Main Gate to AIML Block"', async () => {
  const res = await processGravityAssistantQuery('navigate from Highway Entrance to AIML Block', {
    places: INITIAL_PLACES,
    nodes: INITIAL_PATH_NODES,
    segments: INITIAL_PATH_SEGMENTS,
  });
  assert(res.routeData && res.routeData.found === true, 'Must calculate verified walking route');
  assert(res.routeData.totalDistanceMeters > 0, 'Total distance must be positive');
});

await runAsyncTest('Gravity AI: Safety check prevents hallucinating classroom numbers', async () => {
  const res = await processGravityAssistantQuery('Where is room 9999 in space?', {
    places: INITIAL_PLACES,
    nodes: INITIAL_PATH_NODES,
    segments: INITIAL_PATH_SEGMENTS,
  });
  assert(res.reply.includes('strictly avoids guessing') || res.reply.includes('specify:'), 'Must prompt user for department and block instead of hallucinating');
});

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} Tests Passed successfully!`);
console.log(`========================================\n`);
