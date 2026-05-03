import { useState, useEffect, useCallback } from 'react';
import {
  fetchPendingSubmissions,
  updateSubmissionStatus,
} from '../api/submissions';
import type { Submission } from '../api/submissions';

interface Props {
  onApprove: (submission: Submission) => void;
  onCountChange: (count: number) => void;
}

export function SubmissionsPanel({ onApprove, onCountChange }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingSubmissions();
      setSubmissions(data);
      onCountChange(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(submission: Submission) {
    setActionError(null);
    try {
      await updateSubmissionStatus(submission.id, 'approved');
      setSubmissions((prev) => {
        const next = prev.filter((s) => s.id !== submission.id);
        onCountChange(next.length);
        return next;
      });
      onApprove(submission);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
    }
  }

  async function handleDismiss(id: string) {
    setActionError(null);
    try {
      await updateSubmissionStatus(id, 'dismissed');
      setSubmissions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        onCountChange(next.length);
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="animate-spin h-8 w-8 text-[#D97706]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-3 font-sans text-stone-500">Loading submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="font-sans text-sm text-red-700 mb-3">{error}</p>
        <button
          onClick={() => { void load(); }}
          className="bg-[#D97706] text-white font-sans text-sm font-bold rounded-lg px-4 py-2 hover:bg-amber-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 text-center">
        <p className="font-sans text-sm text-stone-500">No pending submissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="font-sans text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {submissions.map((s) => (
        <div
          key={s.id}
          className="bg-white border border-[#E8E0D5] rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-bold text-stone-900 truncate">
                {s.restaurant_name}
              </h3>
              <p className="font-sans text-xs text-stone-500 mt-0.5">{s.location}</p>
              {s.user_note && (
                <p className="font-sans text-xs text-stone-600 mt-2 italic">
                  &ldquo;{s.user_note}&rdquo;
                </p>
              )}
              <p className="font-sans text-xs text-stone-400 mt-2">
                Submitted by {s.user_display_name ?? 'Unknown'} &middot;{' '}
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { void handleApprove(s); }}
              className="bg-[#D97706] text-white font-sans text-xs font-bold rounded-lg px-3 py-1.5 hover:bg-amber-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { void handleDismiss(s.id); }}
              className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
