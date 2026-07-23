import type { Tier } from '../types';

// Shared style constants — the single source for button/chip/card/form classes.
// Colors reference the @theme brand tokens in src/index.css.

// ---- Focus ----
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus';

// ---- Buttons ----
export const BTN_PRIMARY = `inline-flex items-center justify-center bg-brand-cta text-white font-sans text-sm font-bold rounded-lg transition-all duration-150 hover:bg-brand-cta-hover hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0 ${FOCUS_RING}`;
export const BTN_SECONDARY = `inline-flex items-center justify-center border border-brand-border bg-white rounded-lg font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 ${FOCUS_RING}`;
export const BTN_ICON = `p-1.5 rounded-lg border border-brand-border text-stone-500 bg-transparent hover:bg-stone-50 transition-colors duration-150 ${FOCUS_RING}`;

// ---- Chips (filter pills) ----
// border-[1.5px] on the base keeps active/inactive the same width (no toggle shift)
export const CHIP_BASE =
  'rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta';
export const CHIP_ACTIVE = 'bg-brand-chip text-white border-brand-chip';
export const CHIP_INACTIVE = 'bg-white text-stone-500 border-brand-border hover:border-stone-300';

// ---- Chips (admin tag/pick toggles — 44px touch targets) ----
export const CHIP_TOGGLE_BASE =
  'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-colors';
export const CHIP_TOGGLE_ACTIVE = `${CHIP_TOGGLE_BASE} bg-amber-100 text-amber-800 border border-amber-300`;
export const CHIP_TOGGLE_INACTIVE = `${CHIP_TOGGLE_BASE} bg-stone-100 text-stone-500 border border-brand-border hover:bg-stone-200`;
export const CHIP_PICK_ACTIVE = `${CHIP_TOGGLE_BASE} bg-amber-400 text-amber-900 border border-amber-500`;

// ---- Small editor buttons ----
export const BTN_CANCEL =
  `border border-brand-border rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px] ${FOCUS_RING}`;
export const BTN_DANGER_OUTLINE =
  'border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors min-h-[44px]';
export const BTN_INLINE_EDIT =
  'font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center';

// ---- Surfaces ----
export const CARD_SURFACE = 'bg-white border border-brand-border rounded-xl';
export const FROSTED_BAR = 'bg-brand-bg/90 backdrop-blur-sm border-b border-brand-border';

// ---- Forms ----
export const LABEL_CLASS =
  'block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1';
export const INPUT_CLASS =
  'w-full border border-brand-border rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-focus';
export const INPUT_ERROR_CLASS =
  'w-full border border-red-400 rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-300';
export const ERROR_MSG_CLASS = 'text-red-600 text-xs font-sans mt-1';

// ---- Tier badges (DESIGN.md spec: tint bg + dark text) ----
export const TIER_BADGE_BASE =
  'inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[11px] font-bold uppercase tracking-[0.04em]';
export const TIER_BADGE_CLASSES: Record<Tier, string> = {
  loved: 'bg-tier-loved-bg text-tier-loved-text',
  recommended: 'bg-tier-recommended-bg text-tier-recommended-text',
  on_my_radar: 'bg-tier-radar-bg text-tier-radar-text',
};
