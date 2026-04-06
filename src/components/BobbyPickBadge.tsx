export function BobbyPickBadge() {
  return (
    <span
      data-testid="bobby-pick-badge"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-xs font-bold bg-amber-400 text-amber-900"
    >
      <span aria-hidden="true">★</span>
      Bobby's Pick
    </span>
  );
}
