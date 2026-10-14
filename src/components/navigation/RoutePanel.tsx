'use client';

import React, { useState } from 'react';
import { Place, RouteResult } from '../../types/campus';
import { ArrowLeftRight, Navigation, X, ShieldCheck, AlertCircle, Accessibility, ChevronDown, ChevronUp, Footprints } from 'lucide-react';

interface RoutePanelProps {
  places: Place[];
  originPlace: Place | null;
  destPlace: Place | null;
  activeRoute: RouteResult | null;
  userLocation: [number, number] | null;
  isUsingGpsAsOrigin: boolean;
  onSelectOrigin: (place: Place | null, useGps?: boolean) => void;
  onSelectDest: (place: Place | null) => void;
  onSwapRoute: () => void;
  onClearRoute: () => void;
  onToggleAccessible: (enabled: boolean) => void;
  isAccessibleOnly: boolean;
}

export default function RoutePanel({
  places,
  originPlace,
  destPlace,
  activeRoute,
  userLocation,
  isUsingGpsAsOrigin,
  onSelectOrigin,
  onSelectDest,
  onSwapRoute,
  onClearRoute,
  onToggleAccessible,
  isAccessibleOnly,
}: RoutePanelProps) {
  const [showSteps, setShowSteps] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const getTurnIcon = (turnType: string) => {
    switch (turnType) {
      case 'left':
      case 'slight_left':
        return (
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        );
      case 'right':
      case 'slight_right':
        return (
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        );
      case 'arrive':
        return (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-4 w-full transition-all duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Walking Navigation</h3>
            <p className="text-xs text-slate-500">Connected pedestrian campus routes</p>
          </div>
        </div>

        <button
          onClick={onClearRoute}
          title="Exit Route"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin & Destination pickers */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {/* Origin */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex-shrink-0"></span>
            <select
              value={isUsingGpsAsOrigin ? 'GPS' : originPlace?.id || ''}
              onChange={(e) => {
                if (e.target.value === 'GPS') {
                  onSelectOrigin(null, true);
                } else {
                  const p = places.find((x) => x.id === e.target.value) || null;
                  onSelectOrigin(p, false);
                }
              }}
              className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="" disabled>Choose starting point...</option>
              {userLocation && (
                <option value="GPS">📍 My Current Location (GPS)</option>
              )}
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.verificationStatus === 'VERIFIED' ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm flex-shrink-0"></span>
            <select
              value={destPlace?.id || ''}
              onChange={(e) => {
                const p = places.find((x) => x.id === e.target.value) || null;
                onSelectDest(p);
              }}
              className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="" disabled>Choose destination...</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.verificationStatus === 'VERIFIED' ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={onSwapRoute}
          title="Swap starting point and destination"
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      </div>

      {/* Accessibility & Filter Controls */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isAccessibleOnly}
            onChange={(e) => onToggleAccessible(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
          />
          <Accessibility className="w-3.5 h-3.5 text-slate-500" />
          <span>Wheelchair accessible paths</span>
        </label>
      </div>

      {/* Route Result Summary */}
      {activeRoute && activeRoute.found && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between bg-brand-50/60 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-100 dark:border-brand-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex flex-col items-center justify-center font-bold">
                <span className="text-sm leading-none">{activeRoute.estimatedMinutes}</span>
                <span className="text-[9px] uppercase font-semibold">min</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-brand-600" />
                  <span>{activeRoute.totalDistanceMeters} meters walk</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeRoute.isFullyVerified ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified Walkways
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-3 h-3" /> Includes unverified sections
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSteps(!showSteps)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-200/50 transition flex items-center gap-1 text-xs"
            >
              <span>{showSteps ? 'Hide' : 'Steps'}</span>
              {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Turn-by-Turn Instruction List */}
          {showSteps && (
            <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
              {activeRoute.steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition cursor-pointer ${
                    activeStepIndex === idx
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-600">
                    {getTurnIcon(step.turnType)}
                  </div>
                  <div className="flex-1">
                    <p className="leading-snug">{step.instruction}</p>
                    {step.distanceMeters > 0 && (
                      <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                        {step.distanceMeters}m &bull; ~{step.estimatedSeconds}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disconnected / Not Found Warning */}
      {activeRoute && !activeRoute.found && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No direct connected route found</p>
            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
              {activeRoute.errorReason || 'The requested locations are not yet connected by verified campus walkways. Try choosing the Highway Entrance Gate or Main Block as a starting point.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
