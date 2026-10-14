'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Place, PathNode, PathSegment, RouteResult, CampusMeta } from '../../types/campus';
import { CAMPUS_META } from '../../data/campusData';

interface CampusMapProps {
  places: Place[];
  pathNodes?: PathNode[];
  pathSegments?: PathSegment[];
  selectedPlace?: Place | null;
  activeRoute?: RouteResult | null;
  userLocation?: [number, number] | null;
  onSelectPlace?: (place: Place) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isMapEditorMode?: boolean;
  showWalkwayNetwork?: boolean;
}

export default function CampusMap({
  places,
  pathNodes = [],
  pathSegments = [],
  selectedPlace,
  activeRoute,
  userLocation,
  onSelectPlace,
  onMapClick,
  isMapEditorMode = false,
  showWalkwayNetwork = false,
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const walkwaysLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const boundaryLayerRef = useRef<any>(null);
  const [currentTileLayer, setCurrentTileLayer] = useState<'osm' | 'light' | 'satellite'>('light');
  const [mapReady, setMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current!, {
        center: [CAMPUS_META.centerLat, CAMPUS_META.centerLng],
        zoom: CAMPUS_META.defaultZoom,
        minZoom: 15,
        maxZoom: 20,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tile layers
      const tileUrls = {
        light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };

      const tileLayer = L.tileLayer(tileUrls[currentTileLayer], {
        attribution: '&copy; OpenStreetMap contributors &bull; CartoDB &bull; Annamacharya University',
        maxZoom: 20,
      }).addTo(map);

      // Campus Boundary Polygon
      const boundary = L.polygon(CAMPUS_META.boundaryPolygon as any, {
        color: '#2563eb',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.06,
        dashArray: '4, 6',
      }).addTo(map);
      boundaryLayerRef.current = boundary;

      // Layer Groups
      walkwaysLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      // Click event
      map.on('click', (e: any) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;
      if (isMounted) setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const tileUrls = {
        light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };

      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      L.tileLayer(tileUrls[currentTileLayer], {
        attribution: '&copy; OpenStreetMap &bull; Annamacharya University',
        maxZoom: 20,
      }).addTo(mapInstanceRef.current);
    });
  }, [currentTileLayer]);

  // Render Place Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then((L) => {
      markersLayerRef.current.clearLayers();

      const getCategoryColor = (cat: string) => {
        switch (cat) {
          case 'ACADEMIC': return '#2563eb'; // Blue
          case 'CANTEEN': return '#f59e0b'; // Amber
          case 'LIBRARY': return '#8b5cf6'; // Purple
          case 'AUDITORIUM': return '#ec4899'; // Pink
          case 'HOSTEL': return '#10b981'; // Green
          case 'ADMINISTRATION': return '#0f766e'; // Teal
          case 'SPORTS': return '#059669'; // Emerald
          case 'MEDICAL': return '#ef4444'; // Red
          case 'PARKING': return '#64748b'; // Slate
          case 'ENTRANCE': return '#1e293b'; // Dark slate
          default: return '#3b82f6';
        }
      };

      places.forEach((place) => {
        const isSelected = selectedPlace?.id === place.id;
        const isVerified = place.verificationStatus === 'VERIFIED';
        const color = getCategoryColor(place.category);

        const customIcon = L.divIcon({
          className: 'custom-campus-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: ${isSelected ? '36px' : '28px'};
              height: ${isSelected ? '36px' : '28px'};
              background: ${color};
              border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
              border-radius: 50%;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s ease;
              ${!isVerified ? 'border-style: dashed; border-color: #f59e0b;' : ''}
            ">
              <span style="color: #ffffff; font-size: ${isSelected ? '12px' : '10px'}; font-weight: bold;">
                ${place.code ? place.code.slice(0, 3) : place.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            ${
              isSelected
                ? `<div style="
                    position: absolute;
                    bottom: -22px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(15, 23, 42, 0.9);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    pointer-events: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                  ">${place.name}</div>`
                : ''
            }
          `,
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
        });

        const marker = L.marker([place.latitude, place.longitude], { icon: customIcon });

        marker.on('click', () => {
          if (onSelectPlace) onSelectPlace(place);
        });

        marker.bindTooltip(
          `<strong>${place.name}</strong><br/><span style="font-size: 10px; color: #64748b;">${place.category} &bull; ${place.verificationStatus}</span>`,
          { direction: 'top', offset: [0, -14], opacity: 0.95 }
        );

        markersLayerRef.current.addLayer(marker);
      });
    });
  }, [places, selectedPlace, mapReady, onSelectPlace]);

  // Render Walkway Network Graph
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !walkwaysLayerRef.current) return;

    import('leaflet').then((L) => {
      walkwaysLayerRef.current.clearLayers();

      if (!showWalkwayNetwork && !isMapEditorMode) return;

      const nodeMap = new Map<string, PathNode>();
      pathNodes.forEach((n) => nodeMap.set(n.id, n));

      // Draw segments
      pathSegments.forEach((seg) => {
        const u = nodeMap.get(seg.startNodeId);
        const v = nodeMap.get(seg.endNodeId);
        if (u && v) {
          const isClosed = seg.accessStatus === 'TEMPORARILY_CLOSED';
          const polyline = L.polyline(
            [
              [u.latitude, u.longitude],
              [v.latitude, v.longitude],
            ],
            {
              color: isClosed ? '#ef4444' : '#10b981',
              weight: isClosed ? 2 : 3,
              dashArray: isClosed ? '4, 4' : undefined,
              opacity: 0.7,
            }
          );
          polyline.bindTooltip(
            `Walkway: ${seg.distanceMeters}m &bull; ${seg.wayType} (${seg.accessStatus})`,
            { sticky: true }
          );
          walkwaysLayerRef.current.addLayer(polyline);
        }
      });

      // Draw Nodes
      pathNodes.forEach((node) => {
        const circle = L.circleMarker([node.latitude, node.longitude], {
          radius: node.nodeType === 'ENTRANCE' ? 6 : 4,
          fillColor: node.nodeType === 'ENTRANCE' ? '#3b82f6' : '#10b981',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        });
        circle.bindTooltip(`Node: ${node.label} (${node.nodeType})`);
        walkwaysLayerRef.current.addLayer(circle);
      });
    });
  }, [pathNodes, pathSegments, showWalkwayNetwork, isMapEditorMode, mapReady]);

  // Render Active Walking Route
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !routeLayerRef.current) return;

    import('leaflet').then((L) => {
      routeLayerRef.current.clearLayers();

      if (!activeRoute || !activeRoute.found || activeRoute.coordinates.length < 2) return;

      // Base solid shadow line
      const shadowLine = L.polyline(activeRoute.coordinates as any, {
        color: '#1d4ed8',
        weight: 7,
        opacity: 0.4,
      });
      routeLayerRef.current.addLayer(shadowLine);

      // Vibrant animated dashed route line
      const activeLine = L.polyline(activeRoute.coordinates as any, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        className: 'animated-route-path',
      });
      routeLayerRef.current.addLayer(activeLine);

      // Start Marker (Pin A)
      const startCoord = activeRoute.coordinates[0];
      const startIcon = L.divIcon({
        className: 'route-start-icon',
        html: `
          <div style="
            background: #10b981;
            color: white;
            font-size: 11px;
            font-weight: 800;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">A</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const startMarker = L.marker(startCoord as any, { icon: startIcon });
      startMarker.bindTooltip('Starting Point', { direction: 'top' });
      routeLayerRef.current.addLayer(startMarker);

      // End Marker (Pin B)
      const endCoord = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      const endIcon = L.divIcon({
        className: 'route-end-icon',
        html: `
          <div style="
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 800;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">B</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const endMarker = L.marker(endCoord as any, { icon: endIcon });
      endMarker.bindTooltip('Destination', { direction: 'top' });
      routeLayerRef.current.addLayer(endMarker);

      // Fit map bounds to show full route nicely
      const bounds = L.latLngBounds(activeRoute.coordinates as any);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
    });
  }, [activeRoute, mapReady]);

  // Render User Location
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-location-container',
          html: `
            <div class="user-location-pulse">
              <div class="user-location-core"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 });
        marker.bindTooltip('Your Current GPS Location', { direction: 'top', offset: [0, -10] });
        marker.addTo(mapInstanceRef.current);
        userMarkerRef.current = marker;
      }
    });
  }, [userLocation, mapReady]);

  // Center on Selected Place
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedPlace) return;
    mapInstanceRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 18, {
      duration: 0.8,
    });
  }, [selectedPlace, mapReady]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([CAMPUS_META.centerLat, CAMPUS_META.centerLng], CAMPUS_META.defaultZoom, {
      duration: 0.8,
    });
  };

  const handleLocateMe = () => {
    if (!userLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(userLocation, 18, { duration: 0.8 });
  };

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute right-3 bottom-24 md:bottom-8 z-[500] flex flex-col gap-2">
        {/* Recenter Campus Button */}
        <button
          onClick={handleRecenter}
          title="Recenter Campus"
          className="w-10 h-10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* GPS Locate Me Button */}
        {userLocation && (
          <button
            onClick={handleLocateMe}
            title="Locate My Position"
            className="w-10 h-10 bg-brand-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-brand-700 transition active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Map Tile Layer Toggle */}
        <button
          onClick={() => {
            const nextLayer = currentTileLayer === 'light' ? 'satellite' : currentTileLayer === 'satellite' ? 'osm' : 'light';
            setCurrentTileLayer(nextLayer);
          }}
          title={`Layer: ${currentTileLayer.toUpperCase()}`}
          className="w-10 h-10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      </div>

      {/* University Branding Pill */}
      <div className="absolute top-4 left-4 z-[400] hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Annamacharya University, Rajampet</span>
      </div>
    </div>
  );
}
