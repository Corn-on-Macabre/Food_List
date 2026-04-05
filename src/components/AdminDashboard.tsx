import { useState } from 'react';
import { useAdminAuth } from '../hooks';
import { AddRestaurantPanel } from './AddRestaurantPanel';
import type { Restaurant } from '../types';

export function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [sessionRestaurants, setSessionRestaurants] = useState<Restaurant[]>([]);

  function handleRestaurantAdded(restaurant: Restaurant) {
    setSessionRestaurants(prev => [restaurant, ...prev]);
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
                <li
                  key={r.id}
                  className="bg-white border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-700"
                >
                  <span className="font-bold">{r.name}</span>
                  <span className="text-stone-400 ml-2">{r.cuisine} · {r.tier}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
