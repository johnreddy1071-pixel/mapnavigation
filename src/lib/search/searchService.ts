import { Place, CampusPlaceCategory } from '../../types/campus';

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const SYNONYM_MAP: Record<string, string[]> = {
  canteen: ['cafeteria', 'mess', 'food', 'snacks', 'juice', 'lunch', 'breakfast', 'tea', 'dining'],
  food: ['canteen', 'cafeteria', 'mess', 'snacks'],
  mess: ['canteen', 'cafeteria', 'food'],
  library: ['books', 'reading', 'digital library', 'journals', 'study'],
  admin: ['main block', 'administrative', 'principal', 'registrar', 'vc', 'vice chancellor', 'admissions'],
  vc: ['main block', 'vice chancellor', 'principal', 'administration'],
  principal: ['main block', 'administration'],
  gate: ['highway entrance', 'main gate', 'arch', 'security', 'nh716'],
  entrance: ['main gate', 'highway entrance', 'arch'],
  sports: ['cricket', 'playground', 'volleyball', 'tennis', 'gym', 'basketball', 'track'],
  ground: ['cricket ground', 'playground', 'sports', 'football'],
  gym: ['open gym', 'basketball', 'fitness', 'workout'],
  hostel: ['boys hostel', 'girls hostel', 'residence'],
  ladies: ['girls hostel', 'women hostel'],
  doctor: ['health center', 'medical', 'clinic', 'first aid', 'dispensary'],
  clinic: ['health center', 'medical', 'doctor'],
  medicine: ['health center', 'pharmacy'],
  audi: ['auditorium', 'mini auditorium', 'gallery hall'],
  auditorium: ['mini auditorium', 'central auditorium', 'convocation'],
  ai: ['aiml', 'aids', 'artificial intelligence', 'machine learning', 'data science'],
  aiml: ['ai', 'machine learning', 'artificial intelligence'],
  aids: ['ai', 'data science', 'artificial intelligence'],
  mech: ['mechanical', 'workshop', 'cad cam', 'machine shop'],
  civil: ['survey', 'concrete', 'soil', 'structures'],
  ece: ['electronics', 'communication', 'vlsi', 'embedded'],
  eee: ['electrical', 'power', 'machines'],
};

export interface SearchResultItem {
  place: Place;
  score: number;
  matchReason: string;
}

/**
 * Searches places with fuzzy matching, synonyms, abbreviations, and category filtering.
 */
export function searchPlaces(
  query: string,
  places: Place[],
  categoryFilter?: CampusPlaceCategory | 'ALL',
  limit = 10
): SearchResultItem[] {
  let cleaned = query.trim().toLowerCase();

  // Strip common filler query prefixes like "where is", "find the", "how to get to", "take me to"
  cleaned = cleaned
    .replace(/^(where is|where's|find the|find|search for|how to get to|how do i reach|take me to|navigate to|go to|show me)\s+/i, '')
    .trim();

  // Filter by category first if specified
  let candidates = places.filter((p) => p.publicationStatus === 'PUBLISHED');
  if (categoryFilter && categoryFilter !== 'ALL') {
    candidates = candidates.filter((p) => p.category === categoryFilter);
  }

  // If query is empty, return popular places in category or general
  if (!cleaned) {
    return candidates.slice(0, limit).map((place) => ({
      place,
      score: 1,
      matchReason: 'Campus Directory',
    }));
  }

  const queryTokens = cleaned.split(/\s+/).filter(Boolean);

  // Expand query with synonyms
  const expandedTokens = new Set<string>(queryTokens);
  queryTokens.forEach((token) => {
    const syns = SYNONYM_MAP[token] || [];
    syns.forEach((s) => expandedTokens.add(s));
  });

  const results: SearchResultItem[] = [];

  for (const place of candidates) {
    let score = 0;
    let matchReason = '';
    const nameLower = place.name.toLowerCase();
    const normLower = place.normalizedName.toLowerCase();
    const aliasesLower = place.aliases.map((a) => a.toLowerCase());
    const tagsLower = place.tags.map((t) => t.toLowerCase());

    // 1. Exact Name Match
    if (nameLower === cleaned) {
      score += 150;
      matchReason = 'Exact name match';
    } else if (nameLower.startsWith(cleaned)) {
      score += 100;
      matchReason = 'Name starts with search';
    } else if (nameLower.includes(cleaned)) {
      score += 75;
      matchReason = 'Name contains search query';
    }

    // 2. Exact Alias Match
    if (aliasesLower.some((a) => a === cleaned)) {
      score += 90;
      if (!matchReason) matchReason = 'Known alias / common name';
    } else if (aliasesLower.some((a) => a.includes(cleaned))) {
      score += 60;
      if (!matchReason) matchReason = 'Matching alias';
    }

    // 3. Normalized string and tags
    if (normLower.includes(cleaned)) {
      score += 50;
      if (!matchReason) matchReason = 'Facility / department match';
    }

    // 4. Token & Synonym overlap
    let tokenMatches = 0;
    Array.from(expandedTokens).forEach((token) => {
      if (nameLower.includes(token)) tokenMatches += 2;
      else if (aliasesLower.some((a) => a.includes(token))) tokenMatches += 2;
      else if (tagsLower.some((t) => t.includes(token))) tokenMatches += 1;
      else if (normLower.includes(token)) tokenMatches += 1;
    });
    score += tokenMatches * 15;

    // 5. Fuzzy match for short typos if no direct match yet
    if (score === 0 && cleaned.length >= 3) {
      for (const word of nameLower.split(/\s+/)) {
        if (word.length >= 3) {
          const dist = levenshteinDistance(cleaned, word);
          if (dist === 1) {
            score += 45;
            matchReason = `Did you mean '${place.name}'?`;
            break;
          } else if (dist === 2 && cleaned.length >= 5) {
            score += 25;
            matchReason = `Similar to '${place.name}'`;
            break;
          }
        }
      }

      // Check aliases for fuzzy match
      if (score === 0) {
        for (const alias of aliasesLower) {
          const dist = levenshteinDistance(cleaned, alias);
          if (dist <= 1) {
            score += 40;
            matchReason = `Did you mean '${alias}'?`;
            break;
          }
        }
      }
    }

    // Boost verified places slightly
    if (place.verificationStatus === 'VERIFIED') {
      score += 5;
    }

    if (score > 0) {
      results.push({ place, score, matchReason: matchReason || 'Keyword match' });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Recommended popular destinations for first-time visitors
 */
export function getPopularPlaces(places: Place[]): Place[] {
  const popularIds = [
    'place-main-gate',
    'place-main-block',
    'place-central-library',
    'place-canteen',
    'place-aiml-block',
    'place-cricket-ground',
    'place-health-center',
    'place-boys-hostel',
  ];

  return popularIds
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => Boolean(p));
}
