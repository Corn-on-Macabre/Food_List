import { Link } from 'react-router-dom';
import { DISTANCE_OPTIONS } from '../utils';
import { useAdminAuth } from '../hooks';
import { UserMenu } from './UserMenu';
import type { Tier } from '../types/restaurant';

interface FilterBarProps {
  cuisines: string[];
  activeCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  // Story 3.4 additions:
  activeTier: Tier | null;
  onTierChange: (tier: Tier | null) => void;
  // Story 3.2 additions:
  userCoords: { lat: number; lng: number } | null;
  geoDenied: boolean;
  // activeDistance: effectiveMaxDistance (null when geoDenied/no-coords) — chip visually resets to "Any"
  activeDistance: number | null;
  onDistanceChange: (miles: number | null) => void;
  // Story 6.2 additions:
  searchTerm: string | null;
  onSearchChange: (term: string | null) => void;
  // Story 3.3 additions:
  // hasActiveFilters uses filters.maxDistance (user intent), not effectiveMaxDistance.
  // This allows Clear Filters to appear even when location is unavailable and the distance
  // row is hidden — clearing is always safe and reflects the user's stated intent.
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved',       label: 'Loved It' },
  { value: 'recommended', label: 'Worth Recommending' },
  { value: 'on_my_radar', label: 'Want to Go' },
];

const chipBase =
  'rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600';
const chipActive = 'bg-amber-700 text-white border border-amber-700';
const chipInactive = 'bg-white text-stone-500 border border-[#E8E0D5] [border-width:1.5px]';

export function FilterBar({
  cuisines,
  activeCuisine,
  onCuisineChange,
  activeTier,
  onTierChange,
  userCoords,
  geoDenied,
  activeDistance,
  onDistanceChange,
  searchTerm,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
}: FilterBarProps) {
  const { isAuthenticated } = useAdminAuth();

  const handleAllClick = () => {
    onCuisineChange(null);
  };

  const handleCuisineClick = (cuisine: string) => {
    if (cuisine === activeCuisine) {
      onCuisineChange(null);
    } else {
      onCuisineChange(cuisine);
    }
  };

  const handleTierClick = (tier: Tier) => {
    if (tier === activeTier) {
      onTierChange(null);
    } else {
      onTierChange(tier);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Top bar: Admin link (when admin-authenticated) + User menu (always) */}
      <div className="flex items-center justify-end gap-3 px-4 pt-2">
        {isAuthenticated && (
          <Link
            to="/admin"
            className="font-sans text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors duration-150"
          >
            Admin &rarr;
          </Link>
        )}
        <UserMenu />
      </div>
      {/* Filter controls — search + chips grouped for screen readers (F4 fix) */}
      <div role="group" aria-label="Filters" className="flex flex-col">
        {/* Search input */}
        <div className="relative mx-4 mt-2">
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
            aria-label="Search restaurants by name"
            placeholder="Search restaurants..."
            value={searchTerm ?? ''}
            onChange={(e) => onSearchChange(e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchChange(null);
                e.currentTarget.blur();
              }
            }}
            className="w-full pl-9 pr-8 py-2 text-xs font-sans bg-white border border-[#E8E0D5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FDE68A] placeholder:text-stone-400 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchTerm !== null && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange(null)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {/* Cuisine row */}
        <div role="group" aria-label="Filter by cuisine" className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
          <button
            className={`${chipBase} ${activeCuisine === null ? chipActive : chipInactive}`}
            aria-pressed={activeCuisine === null}
            onClick={handleAllClick}
          >
            All
          </button>
          {cuisines.map((cuisine) => {
            const isActive = cuisine === activeCuisine;
            return (
              <button
                key={cuisine}
                className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
                aria-pressed={isActive}
                onClick={() => handleCuisineClick(cuisine)}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
        {/* Tier row — always visible */}
        <div role="group" aria-label="Filter by list type" className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          <button
            className={`${chipBase} ${activeTier === null ? chipActive : chipInactive}`}
            aria-pressed={activeTier === null}
            onClick={() => onTierChange(null)}
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
        {/* Distance row — only when coords available and not denied */}
        {!geoDenied && userCoords !== null && (
          <div
            role="group"
            aria-label="Filter by distance"
            className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
          >
            <button
              className={`${chipBase} ${activeDistance === null ? chipActive : chipInactive}`}
              aria-pressed={activeDistance === null}
              onClick={() => onDistanceChange(null)}
            >
              Any
            </button>
            {DISTANCE_OPTIONS.map(({ label, miles }) => {
              const isActive = activeDistance === miles;
              return (
                <button
                  key={miles}
                  className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
                  aria-pressed={isActive}
                  onClick={() => onDistanceChange(isActive ? null : miles)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {/* Clear Filters — outside filter controls group; sibling in accessibility tree */}
      {hasActiveFilters && (
        <div className="flex justify-end px-4 pb-2 pt-1 border-t border-stone-100">
          <button
            onClick={onClearFilters}
            aria-label="Clear all filters"
            className="text-xs font-sans font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
