import { useState } from 'react';
import { useAdminAuth } from '../hooks';
import { AddRestaurantPanel } from './AddRestaurantPanel';
import { SessionRestaurantCard } from './SessionRestaurantCard';
import type { Restaurant, Tier } from '../types';

export function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [sessionRestaurants, setSessionRestaurants] = useState<Restaurant[]>([]);

  function handleRestaurantAdded(restaurant: Restaurant) {
    setSessionRestaurants(prev => [restaurant, ...prev]);
  }

  function handleTierChange(id: string, newTier: Tier) {
    setSessionRestaurants(prev =>
      prev.map(r => r.id === id ? { ...r, tier: newTier } : r)
    );
  }

  function handleNotesChange(id: string, notes: string) {
    setSessionRestaurants(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, notes: notes.trim() || undefined }
          : r
      )
    );
  }

  function handleSourceChange(id: string, source: string) {
    setSessionRestaurants(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, source: source.trim() || undefined }
          : r
      )
    );
  }

  function handleTagsChange(id: string, tags: string[]) {
    setSessionRestaurants(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, tags: tags.length > 0 ? tags : undefined }
          : r
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#FFFBF5] border-b border-[#E8E0D5] shadow-sm flex items-center justify-between px-5 z-50">
        <span className="font-display text-xl font-bold text-stone-900">
          Food List — Curator Dashboard
        </span>
        <button
          onClick={logout}
          aria-label="Sign out of curator dashboard"
          className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="pt-[60px] max-w-2xl mx-auto px-4 py-8">
        <AddRestaurantPanel onRestaurantAdded={handleRestaurantAdded} />

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
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
