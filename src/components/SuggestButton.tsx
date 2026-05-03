interface Props {
  onClick: () => void;
}

export function SuggestButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Suggest a restaurant"
      className="fixed bottom-4 right-4 z-10 bg-[#D97706] text-white font-sans text-sm font-bold rounded-full px-4 py-2.5 shadow-lg hover:bg-amber-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
    >
      Suggest a Restaurant
    </button>
  );
}
