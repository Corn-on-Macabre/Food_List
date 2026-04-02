interface FilterBarProps {
  cuisines: string[];
  activeCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
}

const chipBase =
  'rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200';
const chipActive = 'bg-amber-600 text-white border border-amber-600';
const chipInactive = 'bg-white text-stone-500 border border-[#E8E0D5] [border-width:1.5px]';

export function FilterBar({ cuisines, activeCuisine, onCuisineChange }: FilterBarProps) {
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
    <div
      className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
      role="group"
      aria-label="Filter by cuisine"
    >
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
  );
}
