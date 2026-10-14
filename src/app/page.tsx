'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Place, PathNode, PathSegment, RouteResult, CampusPlaceCategory } from '../types/campus';
import { CAMPUS_META } from '../data/campusData';
import { searchPlaces, getPopularPlaces } from '../lib/search/searchService';
import { routeBetweenPlaces, findNearestNode, calculateDistance } from '../lib/routing/engine';
import RoutePanel from '../components/navigation/RoutePanel';
import PlaceDetailsModal from '../components/navigation/PlaceDetailsModal';
import ReportIssueModal from '../components/navigation/ReportIssueModal';
import GravityChatModal from '../components/chat/GravityChatModal';
import {
  Search,
  MapPin,
  Navigation,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Layers,
  Settings,
  Sparkles,
  Info,
  X,
  Building2,
  Utensils,
  BookOpen,
  Trophy,
  BedDouble,
  HeartPulse,
  Car,
  DoorOpen,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import Leaflet Campus Map to avoid SSR window errors
const CampusMap = dynamic(() => import('../components/map/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wide">
          Loading Annamacharya University Interactive Map...
        </p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [segments, setSegments] = useState<PathSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CampusPlaceCategory | 'ALL'>('ALL');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Selected place for details
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Navigation State
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [originPlace, setOriginPlace] = useState<Place | null>(null);
  const [destPlace, setDestPlace] = useState<Place | null>(null);
  const [isUsingGpsAsOrigin, setIsUsingGpsAsOrigin] = useState(false);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isAccessibleOnly, setIsAccessibleOnly] = useState(false);

  // User Geolocation
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isOutsideCampus, setIsOutsideCampus] = useState(false);

  // Modals & Panels
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Load campus data from API
  useEffect(() => {
    async function loadCampusData() {
      try {
        const [placesRes, pathsRes] = await Promise.all([
          fetch('/api/places').then((r) => r.json()),
          fetch('/api/paths').then((r) => r.json()),
        ]);

        if (placesRes.success) setPlaces(placesRes.places);
        if (pathsRes.success) {
          setNodes(pathsRes.nodes);
          setSegments(pathsRes.segments);
        }
      } catch (err) {
        console.error('Error loading initial campus data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampusData();
  }, []);

  // Browser Geolocation
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setGpsError(null);

        // Check if user is near campus (within 2 km)
        const distFromCenter = calculateDistance(lat, lng, CAMPUS_META.centerLat, CAMPUS_META.centerLng);
        if (distFromCenter > 2000) {
          setIsOutsideCampus(true);
        } else {
          setIsOutsideCampus(false);
        }
      },
      (err) => {
        console.warn('Geolocation permission denied or error:', err);
        setGpsError('Location permission denied. You can still navigate by picking any campus landmark.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Recalculate route whenever endpoints change
  useEffect(() => {
    if (!destPlace || (!originPlace && !isUsingGpsAsOrigin)) {
      setActiveRoute(null);
      return;
    }

    if (isUsingGpsAsOrigin && userLocation) {
      const nearestNode = findNearestNode(userLocation[0], userLocation[1], nodes, 350);
      const destNodeId =
        destPlace.entranceNodeId || findNearestNode(destPlace.latitude, destPlace.longitude, nodes)?.node.id;

      if (nearestNode && destNodeId) {
        import('../lib/routing/engine').then(({ findCampusRoute }) => {
          const res = findCampusRoute(nearestNode.node.id, destNodeId, nodes, segments, {
            requireAccessible: isAccessibleOnly,
          });
          setActiveRoute(res);
        });
      } else {
        setActiveRoute({
          found: false,
          nodes: [],
          segments: [],
          coordinates: [],
          totalDistanceMeters: 0,
          estimatedMinutes: 0,
          steps: [],
          isFullyVerified: false,
          errorReason:
            'Your GPS position is outside the mapped campus walkway network. Please select a verified starting point on campus, such as Highway Entrance Gate.',
        });
      }
    } else if (originPlace && destPlace) {
      const res = routeBetweenPlaces(originPlace, destPlace, nodes, segments, {
        requireAccessible: isAccessibleOnly,
      });
      setActiveRoute(res);
    }
  }, [originPlace, destPlace, isUsingGpsAsOrigin, userLocation, nodes, segments, isAccessibleOnly]);

  // Search Results
  const searchResults = useMemo(() => {
    return searchPlaces(searchQuery, places, selectedCategory, 8);
  }, [searchQuery, places, selectedCategory]);

  const popularPlaces = useMemo(() => {
    return getPopularPlaces(places);
  }, [places]);

  // Categories list
  const categoryFilters: { id: CampusPlaceCategory | 'ALL'; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Places', icon: Compass },
    { id: 'ACADEMIC', label: 'Academic Blocks', icon: Building2 },
    { id: 'CANTEEN', label: 'Canteen & Food', icon: Utensils },
    { id: 'LIBRARY', label: 'Central Library', icon: BookOpen },
    { id: 'SPORTS', label: 'Sports & Grounds', icon: Trophy },
    { id: 'HOSTEL', label: 'Hostels', icon: BedDouble },
    { id: 'MEDICAL', label: 'Health Center', icon: HeartPulse },
    { id: 'PARKING', label: 'Parking Bays', icon: Car },
    { id: 'ENTRANCE', label: 'Campus Gates', icon: DoorOpen },
  ];

  // Handlers
  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleStartNavigationTo = (place: Place) => {
    setDestPlace(place);
    // Set default origin to Main Gate if no origin chosen
    if (!originPlace && !isUsingGpsAsOrigin) {
      const defaultStart = places.find((p) => p.id === 'place-main-gate') || places[0];
      setOriginPlace(defaultStart);
    }
    setIsRoutingActive(true);
    setSelectedPlace(null);
  };

  const handleSetAsOrigin = (place: Place) => {
    setOriginPlace(place);
    setIsUsingGpsAsOrigin(false);
    setIsRoutingActive(true);
    setSelectedPlace(null);
  };

  const handleSwapRoute = () => {
    if (originPlace && destPlace) {
      const temp = originPlace;
      setOriginPlace(destPlace);
      setDestPlace(temp);
    }
  };

  const handleClearRoute = () => {
    setIsRoutingActive(false);
    setActiveRoute(null);
    setOriginPlace(null);
    setDestPlace(null);
    setIsUsingGpsAsOrigin(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-900 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Logo & University Title */}
          <div className="flex items-center gap-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-brand-500/20">
              AG
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  AI GRAVITY
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-1.5 py-0.2 rounded">
                  Navigator
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Annamacharya University, Rajampet</p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2">
            {/* Gravity AI Assistant Trigger */}
            <button
              onClick={() => setShowChatModal(true)}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-semibold text-xs px-3.5 py-2 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Gravity AI</span>
            </button>

            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold p-2.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 transition active:scale-95 flex items-center justify-center"
              title="Campus Map Editor & Administration"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Full-screen Leaflet Map */}
      <div className="relative flex-1 w-full h-full">
        <CampusMap
          places={
            selectedCategory === 'ALL'
              ? places
              : places.filter((p) => p.category === selectedCategory)
          }
          pathNodes={nodes}
          pathSegments={segments}
          selectedPlace={selectedPlace}
          activeRoute={activeRoute}
          userLocation={userLocation}
          onSelectPlace={handleSelectPlace}
        />
      </div>

      {/* Floating Search Bar & Category Filters (Upper Overlay) */}
      <div className="absolute top-16 sm:top-20 left-0 right-0 z-20 pointer-events-none px-3 sm:px-4">
        <div className="max-w-md mx-auto pointer-events-auto space-y-2">
          {/* Search Box */}
          <div className="relative">
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search campus (e.g. Canteen, AIML Block, Library)..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Search Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto p-2 z-50">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {searchQuery ? `Search Results (${searchResults.length})` : 'Popular Campus Destinations'}
                  </span>
                  <button
                    onClick={() => setIsSearchFocused(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                {(searchQuery ? searchResults.map((r) => r.place) : popularPlaces).map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{place.name}</h4>
                        <span className="text-[10px] text-slate-500">{place.category} &bull; {place.floorInfo || 'Ground'}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        place.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {place.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Horizontal Filter Pills */}
          {!isRoutingActive && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categoryFilters.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-md transition active:scale-95 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-brand-600/25'
                        : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Outside Campus Warning Toast */}
      {isOutsideCampus && showInfoBanner && (
        <div className="absolute top-36 sm:top-40 left-4 right-4 max-w-md mx-auto z-20 bg-amber-500/90 backdrop-blur-md text-white text-xs p-3 rounded-2xl shadow-xl flex items-start justify-between gap-2 border border-amber-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">You are outside Annamacharya University campus</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Directions are computed inside the campus network. Highway Entrance Gate is suggested as your starting point.
              </p>
            </div>
          </div>
          <button onClick={() => setShowInfoBanner(false)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Floating Interactive Panels (Drawer / Modals) */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-30 pointer-events-none flex flex-col gap-3">
        {/* Place Details Modal */}
        {selectedPlace && !isRoutingActive && (
          <div className="pointer-events-auto w-full">
            <PlaceDetailsModal
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onNavigateHere={handleStartNavigationTo}
              onSetAsOrigin={handleSetAsOrigin}
              onReportIssue={(p) => {
                setReportingPlace(p);
                setShowReportModal(true);
              }}
            />
          </div>
        )}

        {/* Route Navigation Panel */}
        {isRoutingActive && (
          <div className="pointer-events-auto w-full">
            <RoutePanel
              places={places}
              originPlace={originPlace}
              destPlace={destPlace}
              activeRoute={activeRoute}
              userLocation={userLocation}
              isUsingGpsAsOrigin={isUsingGpsAsOrigin}
              onSelectOrigin={(p, useGps) => {
                if (useGps) {
                  requestUserLocation();
                  setIsUsingGpsAsOrigin(true);
                  setOriginPlace(null);
                } else {
                  setIsUsingGpsAsOrigin(false);
                  setOriginPlace(p);
                }
              }}
              onSelectDest={(p) => setDestPlace(p)}
              onSwapRoute={handleSwapRoute}
              onClearRoute={handleClearRoute}
              onToggleAccessible={(enabled) => setIsAccessibleOnly(enabled)}
              isAccessibleOnly={isAccessibleOnly}
            />
          </div>
        )}

        {/* Quick Bottom Control Bar if no place or route active */}
        {!selectedPlace && !isRoutingActive && (
          <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={requestUserLocation}
                className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-brand-100 transition active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>My Location</span>
              </button>

              <button
                onClick={() => {
                  const mainGate = places.find((p) => p.id === 'place-main-gate');
                  const canteen = places.find((p) => p.id === 'place-canteen');
                  if (mainGate && canteen) {
                    setOriginPlace(mainGate);
                    setDestPlace(canteen);
                    setIsRoutingActive(true);
                  }
                }}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium px-2 py-1 rounded-lg transition"
              >
                Demo Route
              </button>
            </div>

            <button
              onClick={() => setShowChatModal(true)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3 py-2 rounded-xl shadow-md shadow-brand-600/30 transition active:scale-95"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Guide</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Gravity AI Assistant Button (Corner Pulsing Orb) */}
      <div className="absolute right-4 bottom-4 z-20 pointer-events-auto">
        <button
          onClick={() => setShowChatModal(true)}
          className="w-13 h-13 p-3.5 bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white rounded-2xl shadow-2xl shadow-brand-500/40 hover:scale-105 active:scale-95 transition flex items-center justify-center group"
          title="Open Gravity AI Assistant"
        >
          <Bot className="w-6 h-6 transition-transform group-hover:rotate-12" />
        </button>
      </div>

      {/* Gravity AI Assistant Modal */}
      {showChatModal && (
        <GravityChatModal
          onClose={() => setShowChatModal(false)}
          onApplyRoute={(route) => {
            setActiveRoute(route);
            setIsRoutingActive(true);
          }}
          onSelectPlace={handleSelectPlace}
          userLocation={userLocation}
        />
      )}

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssueModal
          place={reportingPlace}
          onClose={() => {
            setShowReportModal(false);
            setReportingPlace(null);
          }}
        />
      )}
    </div>
  );
}
