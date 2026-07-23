export function BobbyPickBadge() {
  return (
    <span
      data-testid="bobby-pick-badge"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-[11px] font-bold uppercase tracking-[0.04em] bg-tier-loved-bg text-tier-loved-text border border-tier-loved-border"
    >
      <span aria-hidden="true" className="text-tier-loved">★</span>
      Bobby's Pick
    </span>
  );
}
