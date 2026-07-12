import { Link } from 'react-router-dom';
import { DISTANCE_OPTIONS } from '../utils';
import { useAdminAuth } from '../hooks';
import { UserMenu } from './UserMenu';
import { SearchAutocomplete } from './SearchAutocomplete';
import { METRO_REGIONS } from '../constants/metros';
import type { Restaurant, Tier } from '../types/restaurant';

interface FilterBarProps {
  cuisines: string[];
  activeCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  activeTier: Tier | null;
  onTierChange: (tier: Tier | null) => void;
  activeDistance: number | null;
  onDistanceChange: (miles: number | null) => void;
  searchTerm: string | null;
  onSearchChange: (term: string | null) => void;
  restaurants: Restaurant[];
  onRestaurantSelect: (restaurant: Restaurant) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  activeCity: string;
  onCityChange: (cityId: string) => void;
  showDistance: boolean;
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
  activeDistance,
  onDistanceChange,
  searchTerm,
  onSearchChange,
  restaurants,
  onRestaurantSelect,
  hasActiveFilters,
  onClearFilters,
  activeCity,
  onCityChange,
  showDistance,
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
        {/* City selector + Search */}
        <div className="flex items-center gap-2 px-4 pt-2">
          <select
            value={activeCity}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Select city"
            className="rounded-lg border border-[#E8E0D5] bg-white px-2.5 py-1.5 font-sans text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150 cursor-pointer shrink-0"
          >
            {METRO_REGIONS.slice().sort((a, b) => a.label.localeCompare(b.label)).map((metro) => (
              <option key={metro.id} value={metro.id}>
                {metro.label}
              </option>
            ))}
          </select>
        </div>
        {/* Search with autocomplete */}
        <SearchAutocomplete
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          restaurants={restaurants}
          onRestaurantSelect={onRestaurantSelect}
        />
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
        {/* Distance row — only when coords available, not denied, and viewing nearest city */}
        {showDistance && (
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
