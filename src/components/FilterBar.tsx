import { DISTANCE_OPTIONS } from '../utils';

interface FilterBarProps {
  cuisines: string[];
  activeCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  // Story 3.2 additions:
  userCoords: { lat: number; lng: number } | null;
  geoDenied: boolean;
  activeDistance: number | null;
  onDistanceChange: (miles: number | null) => void;
}

const chipBase =
  'rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200';
const chipActive = 'bg-amber-700 text-white border border-amber-700';
const chipInactive = 'bg-white text-stone-500 border border-[#E8E0D5] [border-width:1.5px]';

export function FilterBar({
  cuisines,
  activeCuisine,
  onCuisineChange,
  userCoords,
  geoDenied,
  activeDistance,
  onDistanceChange,
}: FilterBarProps) {
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

  return (
    <div role="group" aria-label="Filters" className="flex flex-col">
      {/* Cuisine row */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
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
  );
}
