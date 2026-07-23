import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks';
import { AddRestaurantPanel } from './AddRestaurantPanel';
import { RestaurantListPanel } from './RestaurantListPanel';
import { SessionRestaurantCard } from './SessionRestaurantCard';
import {
  fetchAllRestaurants,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../api/restaurants';
import { SubmissionsPanel } from './SubmissionsPanel';
import type { Submission } from '../api/submissions';
import type { Restaurant } from '../types';
import { BTN_PRIMARY, BTN_SECONDARY } from './styles';

export function AdminDashboard() {
  const { logout } = useAdminAuth();

  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionRestaurants, setSessionRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'submissions'>('add');
  const [pendingCount, setPendingCount] = useState(0);
  const [prefillName, setPrefillName] = useState<string | null>(null);
  const [prefillLocation, setPrefillLocation] = useState<string | null>(null);
  const [prefillSuggestedBy, setPrefillSuggestedBy] = useState<string | null>(null);
  const [prefillSuggestedByAvatar, setPrefillSuggestedByAvatar] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRestaurants();
      setAllRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  async function handleRestaurantAdded(restaurant: Restaurant) {
    try {
      await addRestaurant(restaurant);
      const updated = await fetchAllRestaurants();
      setAllRestaurants(updated);
      setSessionRestaurants(prev => [restaurant, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add restaurant');
    }
  }

  // Single mutation path: persist, then mirror the change into both lists
  // (session cards and the all-restaurants tab share rows).
  async function applyChange(id: string, changes: Partial<Restaurant>) {
    await updateRestaurant(id, changes);
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, ...changes } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, ...changes } : r))
    );
  }

  async function handleDelete(id: string) {
    await deleteRestaurant(id);
    setAllRestaurants(prev => prev.filter(r => r.id !== id));
    setSessionRestaurants(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-brand-bg border-b border-brand-border shadow-sm flex items-center justify-between px-5 z-50">
        <span className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-xl font-bold text-brand-text whitespace-nowrap">bobby.menu</span>
          <span className="hidden sm:inline font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-brand-text-faint truncate">
            Curator Dashboard
          </span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-sans text-sm font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150"
          >
            &larr; Map
          </Link>
          <button
            onClick={logout}
            aria-label="Sign out of curator dashboard"
            className={`${BTN_SECONDARY} px-3 py-1.5`}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="fixed top-[60px] left-0 right-0 bg-brand-bg z-40">
        <div className="max-w-2xl mx-auto flex gap-6 px-4 py-3 border-b border-brand-border">
          {([
            { key: 'add', label: 'Add Restaurant' },
            { key: 'list', label: `All Restaurants (${allRestaurants.length})` },
            { key: 'submissions', label: `Submissions${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`font-sans text-sm pb-1 transition-colors duration-150 ${
                activeTab === key
                  ? 'border-b-2 border-brand-cta text-brand-text font-bold'
                  : 'text-brand-text-faint hover:text-brand-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-[108px] max-w-2xl mx-auto px-4 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-brand-cta"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="ml-3 font-sans text-brand-text-muted">
              Loading restaurants...
            </span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-lg border border-state-error-border bg-state-error-tint p-4 text-center">
            <p className="font-sans text-sm text-state-error mb-3">{error}</p>
            <button
              onClick={() => void loadRestaurants()}
              className={`${BTN_PRIMARY} px-4 py-2`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab content */}
        {!loading && !error && activeTab === 'add' && (
          <>
            <AddRestaurantPanel
              onRestaurantAdded={handleRestaurantAdded}
              prefill={prefillName && prefillLocation ? {
                name: prefillName,
                location: prefillLocation,
                suggestedBy: prefillSuggestedBy ?? undefined,
                suggestedByAvatar: prefillSuggestedByAvatar ?? undefined,
              } : null}
              onPrefillConsumed={() => { setPrefillName(null); setPrefillLocation(null); setPrefillSuggestedBy(null); setPrefillSuggestedByAvatar(null); }}
            />

            {sessionRestaurants.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-base text-brand-text mb-3">
                  Added this session ({sessionRestaurants.length})
                </h2>
                <ul className="space-y-2">
                  {sessionRestaurants.map(r => (
                    <li key={r.id}>
                      <SessionRestaurantCard
                        restaurant={r}
                        onUpdate={(id, changes) => void applyChange(id, changes)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {!loading && !error && activeTab === 'list' && (
          <RestaurantListPanel
            restaurants={allRestaurants}
            onUpdate={applyChange}
            onDelete={handleDelete}
          />
        )}

        {!loading && !error && activeTab === 'submissions' && (
          <SubmissionsPanel
            onApprove={(submission: Submission) => {
              setPrefillName(submission.restaurant_name);
              setPrefillLocation(submission.location);
              setPrefillSuggestedBy(submission.user_display_name ?? null);
              setPrefillSuggestedByAvatar(submission.user_avatar_url ?? null);
              setActiveTab('add');
            }}
            onCountChange={setPendingCount}
          />
        )}
      </main>
    </div>
  );
}
