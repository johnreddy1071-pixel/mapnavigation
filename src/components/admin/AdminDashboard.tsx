'use client';

import React, { useState, useEffect } from 'react';
import { Place, PathNode, PathSegment, RouteIssue, CampusPlaceCategory } from '../../types/campus';
import {
  Shield,
  MapPin,
  GitFork,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  RefreshCw,
  Lock,
  ArrowLeft,
  FileText,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface AdminDashboardProps {
  onBackToMap: () => void;
}

export default function AdminDashboard({ onBackToMap }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'places' | 'paths' | 'import' | 'reports' | 'checklist'>('places');
  const [places, setPlaces] = useState<Place[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [segments, setSegments] = useState<PathSegment[]>([]);
  const [reports, setReports] = useState<RouteIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for new place
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [newPlace, setNewPlace] = useState<Partial<Place>>({
    name: '',
    category: 'ACADEMIC',
    description: '',
    latitude: 14.2255,
    longitude: 79.1385,
    floorInfo: 'Ground Floor',
    facilities: [],
    verificationStatus: 'AWAITING_VERIFICATION',
    publicationStatus: 'PUBLISHED',
    wheelchairAccessible: true,
  });

  // Import State
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'geojson' | 'csv'>('geojson');
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'au-admin-2026' || passcode === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
      loadData();
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [placesRes, pathsRes, reportsRes] = await Promise.all([
        fetch('/api/places').then((r) => r.json()),
        fetch('/api/paths').then((r) => r.json()),
        fetch('/api/reports').then((r) => r.json()),
      ]);

      if (placesRes.success) setPlaces(placesRes.places);
      if (pathsRes.success) {
        setNodes(pathsRes.nodes);
        setSegments(pathsRes.segments);
      }
      if (reportsRes.success) setReports(reportsRes.reports);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace),
      });
      const data = await res.json();
      if (data.success) {
        setPlaces((prev) => [data.place, ...prev.filter((p) => p.id !== data.place.id)]);
        setShowAddPlaceModal(false);
        setNewPlace({
          name: '',
          category: 'ACADEMIC',
          description: '',
          latitude: 14.2255,
          longitude: 79.1385,
          floorInfo: 'Ground Floor',
          facilities: [],
          verificationStatus: 'AWAITING_VERIFICATION',
          publicationStatus: 'PUBLISHED',
          wheelchairAccessible: true,
        });
      }
    } catch (err) {
      console.error('Failed to save place:', err);
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (!confirm('Are you sure you want to remove this place from the campus database?')) return;
    try {
      const res = await fetch(`/api/places?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPlaces((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete place:', err);
    }
  };

  const handleToggleVerification = async (place: Place) => {
    const updatedStatus = place.verificationStatus === 'VERIFIED' ? 'AWAITING_VERIFICATION' : 'VERIFIED';
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...place, verificationStatus: updatedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlaces((prev) => prev.map((p) => (p.id === place.id ? data.place : p)));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleImport = async (dryRun = false) => {
    if (!importText.trim()) return;
    setImportResult('Processing...');
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: importFormat, data: importText, dryRun }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.message);
        if (!dryRun) loadData();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setImportResult('Network error while processing import.');
    }
  };

  const handleUpdateReport = async (id: string, status: RouteIssue['status']) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  const handleExportData = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        ...places.map((p) => ({
          type: 'Feature',
          properties: {
            id: p.id,
            name: p.name,
            category: p.category,
            verificationStatus: p.verificationStatus,
            description: p.description,
            floorInfo: p.floorInfo,
          },
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude],
          },
        })),
        ...segments.map((s) => {
          const u = nodes.find((n) => n.id === s.startNodeId);
          const v = nodes.find((n) => n.id === s.endNodeId);
          return {
            type: 'Feature',
            properties: {
              id: s.id,
              startNodeId: s.startNodeId,
              endNodeId: s.endNodeId,
              distanceMeters: s.distanceMeters,
              wayType: s.wayType,
              accessStatus: s.accessStatus,
            },
            geometry: {
              type: 'LineString',
              coordinates: u && v ? [[u.longitude, u.latitude], [v.longitude, v.latitude]] : [],
            },
          };
        }),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annamacharya_university_campus_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-brand-600/20 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">AU Map Administration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure portal for maintaining Annamacharya University geospatial coordinates and pedestrian paths.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter administrator passcode..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1.5 text-left">
                Default authorization key: <code className="text-brand-400">au-admin-2026</code>
              </span>
            </div>

            {authError && <p className="text-xs text-rose-400 font-medium">{authError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBackToMap}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
              >
                Back to Map
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMap}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Campus Map</span>
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI Gravity Admin</span>
              <span className="text-[10px] bg-brand-900/60 text-brand-300 border border-brand-700 px-2 py-0.5 rounded-full font-mono">
                Annamacharya University
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export GeoJSON</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh database"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('places')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'places'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Places ({places.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('paths')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'paths'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Walkways ({segments.length} segments, {nodes.length} nodes)</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'import'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Import GeoJSON / CSV</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>User Reports ({reports.filter((r) => r.status === 'PENDING').length} pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'checklist'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verification Audit</span>
        </button>
      </div>

      {/* Tab Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Tab 1: Places */}
        {activeTab === 'places' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Campus Place Directory</h2>
                <p className="text-xs text-slate-400">
                  Manage university buildings, facilities, and coordinate verification status.
                </p>
              </div>
              <button
                onClick={() => setShowAddPlaceModal(true)}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Place</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {place.category}
                      </span>
                      <button
                        onClick={() => handleToggleVerification(place)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition ${
                          place.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {place.verificationStatus === 'VERIFIED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Unverified
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-white">{place.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{place.description}</p>
                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Node: {place.entranceNodeId || 'Nearest'}
                    </span>
                    <button
                      onClick={() => handleDeletePlace(place.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      title="Delete place"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Walkways / Paths */}
        {activeTab === 'paths' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Connected Pedestrian Walkway Graph</h2>
              <p className="text-xs text-slate-400">
                All campus walking routes are computed through these verified segments. Routes never fabricate lines through buildings.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Segment ID</th>
                    <th className="p-3">From Node</th>
                    <th className="p-3">To Node</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Way Type</th>
                    <th className="p-3">Access</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-400">{seg.id}</td>
                      <td className="p-3">{seg.startNodeId}</td>
                      <td className="p-3">{seg.endNodeId}</td>
                      <td className="p-3 font-semibold">{seg.distanceMeters}m</td>
                      <td className="p-3">{seg.wayType}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seg.accessStatus === 'OPEN'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {seg.accessStatus}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-emerald-400">{seg.verificationStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Import / Export */}
        {activeTab === 'import' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white">Import Campus Data</h2>
              <p className="text-xs text-slate-400">
                Paste official GeoJSON features or CSV coordinates to ingest new facilities and path geometry.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setImportFormat('geojson')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  importFormat === 'geojson' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                GeoJSON FeatureCollection
              </button>
              <button
                onClick={() => setImportFormat('csv')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  importFormat === 'csv' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                CSV (name, latitude, longitude, category)
              </button>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={
                importFormat === 'geojson'
                  ? '{\n  "type": "FeatureCollection",\n  "features": [...]\n}'
                  : 'name,latitude,longitude,category,description\nCivil Lab,14.2268,79.1378,ACADEMIC,Testing lab'
              }
              rows={10}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleImport(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Validate Dry Run
              </button>
              <button
                onClick={() => handleImport(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition"
              >
                Commit Import
              </button>
            </div>

            {importResult && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-brand-300">
                {importResult}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Issue Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">User Community Reports Queue</h2>
              <p className="text-xs text-slate-400">
                Submissions from students and visitors regarding walkway closures, incorrect positions, or new rooms.
              </p>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        {rep.issueType}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium">{rep.description}</p>
                    {rep.placeName && (
                      <p className="text-[11px] text-slate-400">Referenced: {rep.placeName}</p>
                    )}
                    {rep.userContact && (
                      <p className="text-[11px] text-brand-400">Contact: {rep.userContact}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {rep.status}
                    </span>
                    {rep.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateReport(rep.id, 'RESOLVED')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-medium transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Verification Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h2 className="text-base font-bold text-white">Campus Onboarding & Verification Checklist</h2>
              <p className="text-xs text-slate-400">
                To guarantee zero hallucination, every facility must be verified against official university site plans and ground GPS measurements.
              </p>
            </div>

            <div className="space-y-2">
              {places.map((place) => {
                const isV = place.verificationStatus === 'VERIFIED';
                return (
                  <div
                    key={place.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {isV ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-white">{place.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {place.category} &bull; Coordinates: [{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}]
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleVerification(place)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                        isV
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-brand-600 text-white hover:bg-brand-500'
                      }`}
                    >
                      {isV ? 'Mark Unverified' : 'Confirm Ground Verification'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add University Place</h3>
            <form onSubmit={handleSavePlace} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Place Name *</label>
                <input
                  type="text"
                  required
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  placeholder="e.g. Biomedical Science Block"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={newPlace.category}
                  onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value as CampusPlaceCategory })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="CANTEEN">CANTEEN</option>
                  <option value="LIBRARY">LIBRARY</option>
                  <option value="AUDITORIUM">AUDITORIUM</option>
                  <option value="HOSTEL">HOSTEL</option>
                  <option value="ADMINISTRATION">ADMINISTRATION</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="MEDICAL">MEDICAL</option>
                  <option value="PARKING">PARKING</option>
                  <option value="ENTRANCE">ENTRANCE</option>
                  <option value="FACILITY">FACILITY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newPlace.latitude}
                    onChange={(e) => setNewPlace({ ...newPlace, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newPlace.longitude}
                    onChange={(e) => setNewPlace({ ...newPlace, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  value={newPlace.description}
                  onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                  placeholder="Official details about this building..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlaceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-xl"
                >
                  Save Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
