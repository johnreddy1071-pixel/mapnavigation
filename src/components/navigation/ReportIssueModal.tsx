'use client';

import React, { useState } from 'react';
import { Place, RouteIssue } from '../../types/campus';
import { Flag, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReportIssueModalProps {
  place?: Place | null;
  onClose: () => void;
}

export default function ReportIssueModal({ place, onClose }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<RouteIssue['issueType']>('WRONG_DIRECTIONS');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please provide a brief description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place?.id,
          placeName: place?.name,
          issueType,
          description,
          userContact: contactEmail || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setErrorMessage('Network error while submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Report Map Issue</h3>
              <p className="text-[11px] text-slate-500">Help improve Annamacharya University campus navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Thank You for Your Feedback!</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Your report has entered the administrator review queue. Verified updates will be published after ground inspection.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
            {place && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Referenced Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{place.name}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue Category
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as RouteIssue['issueType'])}
                className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="WRONG_DIRECTIONS">Wrong walking directions / misleading turns</option>
                <option value="BLOCKED_WALKWAY">Blocked or under construction walkway</option>
                <option value="INCORRECT_POSITION">Incorrect building position on map</option>
                <option value="INCORRECT_NAME">Wrong building or facility name</option>
                <option value="MISSING_LOCATION">Missing classroom, lab, or facility</option>
                <option value="OTHER">Other map correction</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue Details & Ground Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs correction (e.g. 'The entrance is on the north side, not the east', 'Gate is currently closed for maintenance')..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Contact Email (Optional)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="student@annamacharyauniversity.edu.in"
                className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Will only be used by campus admin if clarification is needed.
              </span>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
