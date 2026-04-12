import { useState, useMemo } from 'react';
import { RestaurantListRow } from './RestaurantListRow';
import type { Restaurant, Tier } from '../types/restaurant';

interface RestaurantListPanelProps {
  restaurants: Restaurant[];
  onUpdate: (id: string, changes: Partial<Restaurant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved It' },
  { value: 'recommended', label: 'Worth Recommending' },
  { value: 'on_my_radar', label: 'Want to Go' },
];

const chipBase =
  'rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 min-h-[44px] inline-flex items-center';
const chipActive = 'bg-amber-700 text-white border border-amber-700';
const chipInactive = 'bg-white text-stone-500 border border-[#E8E0D5] [border-width:1.5px]';

export function RestaurantListPanel({
  restaurants,
  onUpdate,
  onDelete,
}: RestaurantListPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = restaurants;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(lower));
    }

    if (activeTier) {
      result = result.filter(r => r.tier === activeTier);
    }

    return result;
  }, [restaurants, searchTerm, activeTier]);

  function handleTierClick(tier: Tier) {
    setActiveTier(prev => (prev === tier ? null : tier));
  }

  return (
    <div className="flex flex-col gap-3 bg-[#FFFBF5] p-4">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          role="searchbox"
          aria-label="Search restaurants"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setSearchTerm('');
              e.currentTarget.blur();
            }
          }}
          className="w-full pl-9 pr-8 py-2 text-xs font-sans bg-white border border-[#E8E0D5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FDE68A] placeholder:text-stone-400 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchTerm('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-600 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tier filter chips */}
      <div role="group" aria-label="Filter by list type" className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          className={`${chipBase} ${activeTier === null ? chipActive : chipInactive}`}
          aria-pressed={activeTier === null}
          onClick={() => setActiveTier(null)}
        >
          All
        </button>
        {TIER_OPTIONS.map(({ value, label }) => {
          const isActive = value === activeTier;
          return (
            <button
              key={value}
              className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
              aria-pressed={isActive}
              onClick={() => handleTierClick(value)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-xs font-sans text-stone-400">
        Showing {filtered.length} of {restaurants.length}
      </p>

      {/* Restaurant list */}
      {filtered.length === 0 ? (
        <p className="text-sm font-sans text-stone-400 text-center py-8">
          No restaurants match your search
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(restaurant => (
            <RestaurantListRow
              key={restaurant.id}
              restaurant={restaurant}
              expanded={expandedId === restaurant.id}
              onToggleExpand={() =>
                setExpandedId(prev => (prev === restaurant.id ? null : restaurant.id))
              }
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
