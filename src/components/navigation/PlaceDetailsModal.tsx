'use client';

import React from 'react';
import { Place } from '../../types/campus';
import { Navigation, MapPin, Clock, Phone, Layers, ShieldCheck, AlertTriangle, Flag, X, CheckCircle2 } from 'lucide-react';

interface PlaceDetailsModalProps {
  place: Place;
  onClose: () => void;
  onNavigateHere: (place: Place) => void;
  onSetAsOrigin: (place: Place) => void;
  onReportIssue: (place: Place) => void;
}

export default function PlaceDetailsModal({
  place,
  onClose,
  onNavigateHere,
  onSetAsOrigin,
  onReportIssue,
}: PlaceDetailsModalProps) {
  const isVerified = place.verificationStatus === 'VERIFIED';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-lg transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Top action row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {place.category}
            </span>
            {place.code && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {place.code}
              </span>
            )}
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3" /> Awaiting GPS Verification
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {place.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {place.description}
      </p>

      {/* Key Metadata Grid */}
      <div className="mt-4 space-y-2 text-xs">
        {place.floorInfo && (
          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Floor & Section: </span>
              <span>{place.floorInfo}</span>
            </div>
          </div>
        )}

        {place.openingHours && (
          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Timings: </span>
              <span>{place.openingHours}</span>
            </div>
          </div>
        )}

        {place.contactPhone && (
          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Contact: </span>
              <a href={`tel:${place.contactPhone}`} className="text-brand-600 hover:underline">
                {place.contactPhone}
              </a>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Coordinates: </span>
            <span className="font-mono text-[11px] text-slate-500">
              {place.latitude.toFixed(5)}° N, {place.longitude.toFixed(5)}° E
            </span>
          </div>
        </div>
      </div>

      {/* Facilities Pills */}
      {place.facilities.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Key Features & Facilities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {place.facilities.map((fac, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {fac}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={() => onNavigateHere(place)}
          className="flex-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
        >
          <Navigation className="w-4 h-4" />
          <span>Navigate Here</span>
        </button>

        <button
          onClick={() => onSetAsOrigin(place)}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition"
        >
          Start Here
        </button>

        <button
          onClick={() => onReportIssue(place)}
          title="Report Map Issue"
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
