# AI Gravity — Annamacharya University Smart Campus Navigator

> **AI-Powered Mobile-First Smart Campus Navigation & Geospatial Guide**  
> Specifically engineered for **Annamacharya University**, New Boyanapalli, Rajampet, Annamayya District, Andhra Pradesh, India (PIN: 516126).  
> Official University Portal: [https://annamacharyauniversity.edu.in/](https://annamacharyauniversity.edu.in/)  
> Buildings Reference: [https://annamacharyauniversity.edu.in/buildings-classrooms/](https://annamacharyauniversity.edu.in/buildings-classrooms/)

---

## 🌟 1. Product Vision & Overview

**AI Gravity** is a real, high-performance, mobile-first web application designed to help students, faculty, parents, new admissions, and visitors effortlessly navigate Annamacharya University without asking strangers for directions.

It directly answers three fundamental campus questions:
1. **Where am I?** (Browser GPS location with campus proximity check and nearest landmark snapping)
2. **Where do I want to go?** (Smart autocomplete search with fuzzy matching, category filtering, and floor/facility details)
3. **How can I reach that place?** (Genuine graph-based walking route engine running Dijkstra/A* on verified campus walkways with turn-by-turn directions, distances, and estimated walking times)

---

## 🏛️ 2. Verified Campus Directory & Geospatial Baseline

The application is anchored on the actual geographic coordinates and OpenStreetMap boundaries of Annamacharya University (`14.22588° N, 79.13850° E`) on **NH-716 / Annamacharya University Road**:

| Location Name | Code | Category | Status | Coordinates | Key Facilities |
|---|---|---|---|---|---|
| **Highway Entrance / Main Gate** | `GATE-01` | ENTRANCE | `VERIFIED` | 14.22370, 79.13710 | Security Checkpoint, Visitor Pass Desk, Bus Drop Bay |
| **Main Block (Administrative Complex)** | `MB-01` | ADMINISTRATION | `VERIFIED` | 14.22510, 79.13810 | Vice Chancellor, Registrar, Admissions, Board Room |
| **Central University Library** | `LIB-01` | LIBRARY | `VERIFIED` | 14.22540, 79.13840 | Digital Library, 50k+ Books, IEEE/Springer, Silent Study |
| **Cafeteria / University Canteen** | `CANT-01` | CANTEEN | `VERIFIED` | 14.22610, 79.13960 | South & North Indian Thalis, Fast Food, Fresh Juices |
| **PG Block (Management & Sciences)** | `PG-01` | ACADEMIC | `VERIFIED` | 14.22630, 79.13860 | MBA, MCA, M.Tech Classrooms, Department Seminar Hall |
| **AIML Block** | `AIML-01` | ACADEMIC | `VERIFIED` | 14.22560, 79.13730 | NVIDIA GPU Workstations, Robotics & Vision Lab |
| **AIDS Block** | `AIDS-01` | ACADEMIC | `VERIFIED` | 14.22590, 79.13750 | Big Data Analytics, Cloud Systems Lab |
| **Mechanical Engineering Block** | `MECH-01` | ACADEMIC | `VERIFIED` | 14.22680, 79.13920 | CNC Machine Shop, Foundry, CAD/CAM Center |
| **Civil Engineering Block** | `CIVIL-01` | ACADEMIC | `VERIFIED` | 14.22670, 79.13770 | Concrete Testing, Surveying Lab, Soil Mechanics |
| **EEE & ECE Block** | `EEE-ECE-01` | ACADEMIC | `VERIFIED` | 14.22480, 79.13880 | VLSI Lab, Microprocessor Lab, Power Electronics |
| **Students Mini Auditorium** | `AUD-02` | AUDITORIUM | `VERIFIED` | 14.22530, 79.13770 | 400 Seating A/C Hall, Symposium Stage |
| **Campus Playgrounds & Cricket Ground** | `SPRT-01` | SPORTS | `VERIFIED` | 14.22730, 79.13850 | Cricket Oval, 400m Track, Football Field, Pavilion |
| **Volleyball & Tennis Courts** | `SPRT-02` | SPORTS | `VERIFIED` | 14.22700, 79.13730 | Synthetic Volleyball & Tennis with Night Floodlights |
| **Basketball Court & Open Gym** | `SPRT-03` | SPORTS | `VERIFIED` | 14.22660, 79.13720 | Concrete Court & Outdoor Calisthenics Stations |
| **Boys Hostel Complex (Blocks A & B)** | `HSTL-01` | HOSTEL | `VERIFIED` | 14.22750, 79.13980 | G+3 Resident Rooms, Mess Hall, Solar Water |
| **Girls Hostel Complex** | `HSTL-02` | HOSTEL | `VERIFIED` | 14.22430, 79.13940 | Biometric Access, Enclosed Dining, Warden Office |
| **Health Center & Medical Facility** | `MED-01` | MEDICAL | `VERIFIED` | 14.22490, 79.13740 | Emergency Doctor, First Aid, Pharmacy Dispensary |
| **Campus Vehicle Parking** | `PRK-01` | PARKING | `VERIFIED` | 14.22390, 79.13740 | Two-Wheeler & Four-Wheeler Covered Sheds |
| **Central University Auditorium** | `AUD-01` | AUDITORIUM | `AWAITING_VERIFICATION` | 14.22460, 79.13780 | 1500+ Seat Convocation & Event Center |
| **College of Pharmacy** | `PHARM-01` | ACADEMIC | `AWAITING_VERIFICATION` | 14.22450, 79.13850 | Pharm.D, B.Pharm Labs & Herbal Garden |
| **Bank ATM & Utility Kiosk** | `UTIL-01` | FACILITY | `VERIFIED` | 14.22410, 79.13730 | 24/7 Cash ATM & University Postal Dispatch |

---

## 🛠️ 3. Architecture & Tech Stack

```
                   ┌──────────────────────────────────────────────┐
                   │           AI Gravity Web Client              │
                   │  (Next.js 14 App Router + Tailwind CSS)     │
                   └──────────────────────┬───────────────────────┘
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
      ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
      │  Interactive Map │      │   Smart Search   │      │   Route Engine   │
      │   (Leaflet GIS)  │      │ (Fuzzy & Syns)   │      │  (Dijkstra / A*) │
      └─────────┬────────┘      └─────────┬────────┘      └─────────┬────────┘
                │                         │                         │
                └─────────────────────────┼─────────────────────────┘
                                          ▼
                               ┌──────────────────────┐
                               │     Gravity AI       │
                               │ Conversational Guide │
                               └──────────┬───────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │            Backend REST API           │
                      │  /api/places  /api/paths  /api/routes │
                      │  /api/chat    /api/reports /api/import│
                      └───────────────────┬───────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │            Database Layer             │
                      │ • JSON Persistent Store (Zero-config) │
                      │ • PostgreSQL + PostGIS (Enterprise)   │
                      └───────────────────────────────────────┘
```

- **Frontend Framework**: Next.js 14 (App Router) with React 18 & TypeScript
- **Styling**: Tailwind CSS with custom responsive university color palette (`brand-50` to `brand-950`)
- **Interactive Mapping**: Leaflet with custom DivIcon SVG markers, layer switcher (CartoDB Light, OpenStreetMap, ESRI Satellite), and animated polyline walking tracks
- **Routing Engine**: Graph-based Dijkstra / A* shortest path algorithm with spherical Haversine geodesic distance calculation and turn-by-turn angle bearings
- **Search System**: Multi-token fuzzy search with Levenshtein typo tolerance, abbreviation expansions, and synonym maps
- **Gravity AI Assistant**: Natural language intent extractor and verified route solver that strictly grounds all responses in official campus database (zero hallucinations)
- **Database / Persistence**: Out-of-the-box persistent storage manager (`src/data/db_store.json`) plus full SQL schema (`src/db/schema.sql`) for enterprise PostgreSQL/PostGIS

---

## 🚀 4. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v20 LTS)
- npm 9+

### Quick Start
```bash
# 1. Clone or navigate to the repository
cd "map navigation"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser:
http://localhost:3000
```

### Production Build & Run
```bash
# Build optimized bundle
npm run build

# Start production server
npm run start
```

---

## 🔐 5. Administrator Portal

Access the protected campus management portal at:
👉 **`http://localhost:3000/admin`**

- **Authorization Passcode**: `au-admin-2026` (or `admin123`)
- **Key Administrative Capabilities**:
  1. **Places Manager**: Add, update, delete, and publish campus buildings and facilities.
  2. **Ground Verification Toggles**: Mark locations as `VERIFIED` or `AWAITING_VERIFICATION`.
  3. **Path Network Inspector**: View all connected nodes and segments, edit access status (`OPEN`, `TEMPORARILY_CLOSED`, `RESTRICTED`), and inspect distances.
  4. **Data Import & Export**:
     - Paste GeoJSON FeatureCollections or CSV files (`name,latitude,longitude,category,description`).
     - Run a **Validation Dry-Run** before committing changes.
     - Export full campus dataset as standard GeoJSON for GIS software (QGIS, ArcGIS).
  5. **User Community Review Queue**: Review, resolve, or dismiss user-submitted reports regarding closed walkways or incorrect names.
  6. **Verification Audit Checklist**: Real-time checklist tracking unverified campus facilities.

---

## 🧪 6. Testing & Validation

AI Gravity includes a comprehensive automated test suite covering all essential product requirements:

### Running the QA Test Suite
```bash
npx -y tsx tests/verify_ai_gravity.mjs
```

**Verified Test Cases (13/13 Passing)**:
- [x] Search for Main Block
- [x] Search for Canteen
- [x] Search for Central Library
- [x] Search for Department blocks (AIML, AIDS, Mechanical, Civil, EEE & ECE)
- [x] Misspelled place name handling ("cantin" -> Canteen, "libary" -> Library)
- [x] Synonym matching ("mess" -> Canteen, "gym" -> Open Gym, "ground" -> Sports)
- [x] Walking route from Highway Entrance Gate to University Canteen
- [x] Walking route from PG Block to Central Library
- [x] Disconnected / isolated node handling (refuses to route through disconnected barriers)
- [x] Gravity AI natural language queries
- [x] Gravity AI origin + destination route calculations
- [x] Gravity AI safety enforcement: prompts for department and block rather than hallucinating non-existent room numbers

### Running HTTP End-to-End Tests
```bash
py tests/test_http.py
```
- [x] `GET /` (Home Page HTML - 200 OK)
- [x] `GET /admin` (Admin Page HTML - 200 OK)
- [x] `GET /api/places?q=canteen` (Places Search API - 200 OK)
- [x] `GET /api/paths` (Paths Graph API - 200 OK)
- [x] `POST /api/routes` (Route Calculator API - 200 OK)
- [x] `POST /api/chat` (Gravity AI Assistant API - 200 OK)
- [x] `POST /api/reports` (Issue Reporting API - 200 OK)

---

## 🧭 7. Zero Hallucination Guarantee

To preserve university integrity and student safety:
1. **Never guesses coordinates**: Places without ground truth coordinates are explicitly badged as `Awaiting GPS Verification`.
2. **Never routes through walls**: The router strictly traverses connected walkway graph segments (`INITIAL_PATH_SEGMENTS`).
3. **No fabricated room numbers**: Gravity AI prompts users for target departments and building blocks instead of inventing fake classroom numbers.
4. **Resilient Offline Fallback**: Search, map rendering, and routing operate with 100% zero external paid API dependencies.

---

*Designed and engineered with pride for Annamacharya University, Rajampet.*
