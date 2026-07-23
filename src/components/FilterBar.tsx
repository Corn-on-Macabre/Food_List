import { Link } from 'react-router-dom';
import { DISTANCE_OPTIONS } from '../utils';
import { useAdminAuth } from '../hooks';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { SearchAutocomplete } from './SearchAutocomplete';
import { METRO_REGIONS, EVERYWHERE_ID } from '../constants/metros';
import { TIER_FILTER_OPTIONS } from '../constants/tiers';
import { CHIP_BASE as chipBase, CHIP_ACTIVE as chipActive, CHIP_INACTIVE as chipInactive } from './styles';
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
  onShareView: () => void;
  activeCity: string;
  onCityChange: (cityId: string) => void;
  showDistance: boolean;
  openNow: boolean;
  onOpenNowChange: (openNow: boolean) => void;
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: readonly string[];
  hasHours: boolean;
  recognized: boolean;
  onRecognizedChange: (recognized: boolean) => void;
  hasAccolades: boolean;
  hideCity?: boolean; // collection mode: the collection spans cities, hide the selector
}

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
  onShareView,
  activeCity,
  onCityChange,
  showDistance,
  openNow,
  onOpenNowChange,
  activeTags,
  onTagToggle,
  availableTags,
  hasHours,
  recognized,
  onRecognizedChange,
  hasAccolades,
  hideCity = false,
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
      {/* Top bar: wordmark + Admin link (when admin-authenticated) + User menu (always) */}
      <div className="flex items-center justify-between gap-3 px-4 pt-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-xl font-bold text-brand-text tracking-[-0.01em] whitespace-nowrap">
            bobby.menu
          </span>
          <span className="hidden sm:inline font-sans text-xs italic text-brand-text-faint truncate">
            a friend's list of places worth eating
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
        {isAuthenticated && (
          <>
            <Link
              to="/stats"
              className="font-sans text-xs font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150"
            >
              Stats &rarr;
            </Link>
            <Link
              to="/admin"
              className="font-sans text-xs font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150"
            >
              Admin &rarr;
            </Link>
          </>
        )}
        <ThemeToggle />
        <UserMenu />
        </div>
      </div>
      {/* Filter controls — search + chips grouped for screen readers (F4 fix) */}
      <div role="group" aria-label="Filters" className="flex flex-col">
        {/* City selector + Search — inline row */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          {!hideCity && (
          <select
            value={activeCity}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Select city"
            className="rounded-full border-[1.5px] border-brand-border bg-brand-surface px-3 py-1 font-sans text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-focus focus:border-brand-accent transition-colors duration-150 cursor-pointer shrink-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2378716c%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] pr-6"
          >
            {METRO_REGIONS.slice().sort((a, b) => a.label.localeCompare(b.label)).map((metro) => (
              <option key={metro.id} value={metro.id}>
                {metro.label}
              </option>
            ))}
            <option value={EVERYWHERE_ID}>&#127758; Everywhere</option>
          </select>
          )}
          <div className="flex-1 min-w-0">
            <SearchAutocomplete
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              restaurants={restaurants}
              onRestaurantSelect={onRestaurantSelect}
            />
          </div>
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
          {TIER_FILTER_OPTIONS.map(({ value, label }) => {
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
        {/* Open Now + vibe tags row — hidden until the city has hours/tag data */}
        {(hasHours || availableTags.length > 0 || hasAccolades) && (
          <div role="group" aria-label="Filter by availability and vibe" className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {hasAccolades && (
              <button
                className={`${chipBase} ${recognized ? chipActive : chipInactive}`}
                aria-pressed={recognized}
                onClick={() => onRecognizedChange(!recognized)}
              >
                &#127942; Recognized
              </button>
            )}
            {hasHours && (
              <button
                className={`${chipBase} ${openNow ? chipActive : chipInactive}`}
                aria-pressed={openNow}
                onClick={() => onOpenNowChange(!openNow)}
              >
                Open Now
              </button>
            )}
            {availableTags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
                  aria-pressed={isActive}
                  onClick={() => onTagToggle(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
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
      {/* Share view + Clear Filters — outside filter controls group; siblings in accessibility tree */}
      {hasActiveFilters && (
        <div className="flex justify-end gap-4 px-4 pb-2 pt-1 border-t border-brand-border-light">
          <button
            onClick={onShareView}
            aria-label="Share this view"
            className="text-xs font-sans font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta rounded"
          >
            Share View
          </button>
          <button
            onClick={onClearFilters}
            aria-label="Clear all filters"
            className="text-xs font-sans font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta rounded"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
