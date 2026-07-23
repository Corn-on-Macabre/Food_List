import { useState, useEffect, useCallback } from 'react';
import {
  fetchPendingSubmissions,
  updateSubmissionStatus,
} from '../api/submissions';
import type { Submission } from '../api/submissions';
import { BTN_PRIMARY } from './styles';

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
          className="animate-spin h-8 w-8 text-brand-cta"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-3 font-sans text-brand-text-muted">Loading submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-state-error-border bg-state-error-tint p-4 text-center">
        <p className="font-sans text-sm text-state-error mb-3">{error}</p>
        <button
          onClick={() => { void load(); }}
          className={`${BTN_PRIMARY} px-4 py-2`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
        <p className="font-sans text-sm text-brand-text-muted">No pending submissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-lg border border-state-error-border bg-state-error-tint p-3">
          <p className="font-sans text-sm text-state-error">{actionError}</p>
        </div>
      )}

      {submissions.map((s) => (
        <div
          key={s.id}
          className="bg-brand-surface border border-brand-border rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-bold text-brand-text truncate">
                {s.restaurant_name}
              </h3>
              <p className="font-sans text-xs text-brand-text-muted mt-0.5">{s.location}</p>
              {s.user_note && (
                <p className="font-sans text-xs text-brand-text mt-2 italic">
                  &ldquo;{s.user_note}&rdquo;
                </p>
              )}
              <p className="font-sans text-xs text-brand-text-faint mt-2">
                Submitted by {s.user_display_name ?? 'Unknown'} &middot;{' '}
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { void handleApprove(s); }}
              className={`${BTN_PRIMARY} px-3 py-1.5`}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { void handleDismiss(s.id); }}
              className="border border-brand-border rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-brand-text-muted hover:bg-brand-hover hover:text-brand-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
