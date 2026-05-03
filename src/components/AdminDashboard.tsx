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
import type { Restaurant, Tier } from '../types';

export function AdminDashboard() {
  const { logout, password } = useAdminAuth();

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
      const data = await fetchAllRestaurants(password);
      setAllRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  async function handleRestaurantAdded(restaurant: Restaurant) {
    try {
      await addRestaurant(password, restaurant);
      const updated = await fetchAllRestaurants(password);
      setAllRestaurants(updated);
      setSessionRestaurants(prev => [restaurant, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add restaurant');
    }
  }

  async function handleTierChange(id: string, newTier: Tier) {
    await updateRestaurant(password, id, { tier: newTier });
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, tier: newTier } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, tier: newTier } : r))
    );
  }

  async function handleNotesChange(id: string, notes: string) {
    const value = notes.trim() || undefined;
    await updateRestaurant(password, id, { notes: value });
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, notes: value } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, notes: value } : r))
    );
  }

  async function handleSourceChange(id: string, source: string) {
    const value = source.trim() || undefined;
    await updateRestaurant(password, id, { source: value });
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, source: value } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, source: value } : r))
    );
  }

  async function handleTagsChange(id: string, tags: string[]) {
    const value = tags.length > 0 ? tags : undefined;
    await updateRestaurant(password, id, { tags: value });
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, tags: value } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, tags: value } : r))
    );
  }

  async function handleFeaturedChange(id: string, featured: boolean) {
    const value = featured ? true : undefined;
    await updateRestaurant(password, id, { featured: value });
    setSessionRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, featured: value } : r))
    );
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, featured: value } : r))
    );
  }

  async function handleUpdate(id: string, changes: Partial<Restaurant>) {
    await updateRestaurant(password, id, changes);
    setAllRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, ...changes } : r))
    );
  }

  async function handleDelete(id: string) {
    await deleteRestaurant(password, id);
    setAllRestaurants(prev => prev.filter(r => r.id !== id));
    setSessionRestaurants(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#FFFBF5] border-b border-[#E8E0D5] shadow-sm flex items-center justify-between px-5 z-50">
        <span className="font-display text-xl font-bold text-stone-900">
          Food List — Curator Dashboard
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-sans text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors duration-150"
          >
            &larr; Map
          </Link>
          <button
            onClick={logout}
            aria-label="Sign out of curator dashboard"
            className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="fixed top-[60px] left-0 right-0 bg-[#FFFBF5] z-40">
        <div className="max-w-2xl mx-auto flex gap-6 px-4 py-3 border-b border-[#E8E0D5]">
          <button
            onClick={() => setActiveTab('add')}
            className={`font-sans text-sm pb-1 transition-colors duration-150 ${
              activeTab === 'add'
                ? 'border-b-2 border-amber-700 text-stone-900 font-bold'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Add Restaurant
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`font-sans text-sm pb-1 transition-colors duration-150 ${
              activeTab === 'list'
                ? 'border-b-2 border-amber-700 text-stone-900 font-bold'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            All Restaurants ({allRestaurants.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`font-sans text-sm pb-1 transition-colors duration-150 ${
              activeTab === 'submissions'
                ? 'border-b-2 border-amber-700 text-stone-900 font-bold'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Submissions{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-[108px] max-w-2xl mx-auto px-4 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-[#D97706]"
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
            <span className="ml-3 font-sans text-stone-500">
              Loading restaurants...
            </span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-sans text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={() => void loadRestaurants()}
              className="bg-[#D97706] text-white font-sans text-sm font-bold rounded-lg px-4 py-2 hover:bg-amber-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
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
                <h2 className="font-display text-base text-stone-900 mb-3">
                  Added this session ({sessionRestaurants.length})
                </h2>
                <ul className="space-y-2">
                  {sessionRestaurants.map(r => (
                    <li key={r.id}>
                      <SessionRestaurantCard
                        restaurant={r}
                        onTierChange={handleTierChange}
                        onNotesChange={handleNotesChange}
                        onSourceChange={handleSourceChange}
                        onTagsChange={handleTagsChange}
                        onFeaturedChange={handleFeaturedChange}
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
            onUpdate={handleUpdate}
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
