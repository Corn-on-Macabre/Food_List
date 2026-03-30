# Food List — Design System

> Generated 2026-03-29 via `/design-consultation` (gstack) + UI/UX Pro Max data.
> Update this file when design decisions change. This is the source of truth for visual language.

---

## Positioning

Food List sits between Beli's utilitarian/social minimalism and Eater's bold editorial voice.
It's a *personal curation* — Bobby's genuine recommendations for the Phoenix metro. The design
should feel warm, trustworthy, and handcrafted. Like a friend's notebook, not an algorithm.

**Design principle:** The map is the hero. The UI chrome stays out of the way. Typography and
warmth create personality, not visual noise.

---

## Color Palette

### App Chrome

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FFFBF5` | Page / app background (warm off-white) |
| `--color-surface` | `#FFFFFF` | Cards, panels, overlays |
| `--color-surface-warm` | `#FFF8EE` | Highlighted surfaces, selected states |
| `--color-border` | `#E8E0D5` | Dividers, card borders, inputs |
| `--color-border-light` | `#F0EBE3` | Subtle separators within cards |
| `--color-text-primary` | `#1C1917` | Headings, primary text (stone-900) |
| `--color-text-secondary` | `#78716C` | Body, cuisine, meta (stone-500) |
| `--color-text-tertiary` | `#A8A29E` | Placeholder, labels (stone-400) |
| `--color-accent` | `#B45309` | Interactive text, links (amber-700) |
| `--color-accent-hover` | `#92400E` | Hover state for accent text (amber-800) |
| `--color-cta` | `#D97706` | Primary button background (amber-600) |
| `--color-cta-hover` | `#B45309` | Primary button hover (amber-700) |
| `--color-focus-ring` | `#FDE68A` | Keyboard focus ring (amber-200) |
| `--color-text-on-cta` | `#FFFFFF` | Text on amber CTA buttons |

### Tier Colors — FIXED, never override

These colors are established in the data model and CLAUDE.md. They must never change.

| Tier | Pin Color | Badge BG | Badge Text |
|------|-----------|----------|------------|
| Loved | `#F59E0B` (amber-400) | `#FEF3C7` | `#92400E` |
| Recommended | `#3B82F6` (blue-500) | `#DBEAFE` | `#1E40AF` |
| On My Radar | `#10B981` (emerald-500) | `#D1FAE5` | `#065F46` |

> **Why amber for CTA instead of blue?** Blue is claimed by the Recommended tier. Using
> blue buttons would confuse the visual hierarchy. Amber harmonizes with gold (Loved) and
> the overall warm palette.

---

## Typography

### Fonts

| Role | Font | Tailwind class |
|------|------|----------------|
| Headings / display | Playfair Display SC | `font-display` (custom) |
| Body / UI | Karla | `font-sans` (override) |

**Source:** Google Fonts. Add to `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display+SC:wght@400;700&family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

**Alternative (self-hosted, faster):** `@fontsource/playfair-display-sc` + `@fontsource/karla`

Add to `tailwind.config` (or Tailwind v4 CSS):

```css
@theme {
  --font-display: 'Playfair Display SC', Georgia, serif;
  --font-sans: 'Karla', system-ui, sans-serif;
}
```

### Type Scale

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| App logo/title | Playfair Display SC | `text-2xl` | 700 | Letter-spacing -0.01em |
| Restaurant name (card) | Playfair Display SC | `text-[22px]` | 700 | Line-height 1.2 |
| Section heading | Playfair Display SC | `text-base` | 400 | |
| Body text | Karla | `text-sm` | 400 | Line-height 1.5 |
| Curator notes | Karla | `text-sm` | 400 italic | Preceded by open-quote decoration |
| Meta / cuisine | Karla | `text-sm` | 400 | `text-stone-500` |
| Badge text | Karla | `text-[11px]` | 700 uppercase | Letter-spacing 0.04em |
| UI labels | Karla | `text-[11px]` | 700 uppercase | Letter-spacing 0.1em, `text-stone-400` |
| CTA button text | Karla | `text-sm` | 700 | |

> **Note on Playfair Display SC:** All letters render as small capitals. This looks excellent
> for restaurant names. If a name looks unusual (very long, special characters), fall back to
> `Playfair Display` (non-SC variant) for that specific element.

---

## Elevation & Shadows

```css
--shadow-sm:   0 1px 2px 0 rgba(28,25,23,0.06);
--shadow-md:   0 4px 6px -1px rgba(28,25,23,0.08), 0 2px 4px -2px rgba(28,25,23,0.06);
--shadow-lg:   0 10px 15px -3px rgba(28,25,23,0.08), 0 4px 6px -4px rgba(28,25,23,0.06);
--shadow-card: 0 2px 8px 0 rgba(28,25,23,0.10);
```

| Component | Shadow |
|-----------|--------|
| App header | `shadow-sm` + border-b |
| Detail card | `shadow-lg` (when overlaying map) |
| Legend | `shadow-md` + border |
| Buttons (hover) | `shadow-md` |
| Map pins | `0 2px 6px rgba(0,0,0,0.28)` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Small chips, micro elements |
| `rounded-md` / `rounded-lg` | 10px / 14px | Buttons, inputs, filter chips |
| `rounded-xl` | 18px | Cards, panels, map legend |
| `rounded-full` | 9999px | Tier badges, map pins, avatar |

---

## Components

### App Header

```
Height: 60px (h-[60px])
Background: --color-bg (#FFFBF5)
Border: border-b with --color-border
Shadow: shadow-sm
Padding: px-5
Logo: Playfair Display SC, 20px, text-stone-900
```

### Map Pins

```
Default size: 14px diameter (w-3.5 h-3.5)
Border: 2.5px solid white
Shadow: 0 2px 6px rgba(0,0,0,0.28)
Hover: scale(1.2), transition 0.15s ease
Selected: 18px diameter, 3px white border,
          ring: 0 0 0 3px rgba(tier-color, 0.3)
```

### Map Legend (overlay)

```
Background: rgba(255,251,245,0.95) + backdrop-blur-sm
Border-radius: rounded-xl
Padding: p-3
Shadow: shadow-md
Border: 1px solid --color-border-light
Position: bottom-3 left-3
Dot: 8px, rounded-full, tier color, 1.5px white border
Text: 11px Karla 600, --color-text-secondary
```

### Detail Card (restaurant)

```
Background: --color-surface (#FFFFFF)
Border-top: 1px solid --color-border-light
Padding: p-5
Drag handle: 36px × 4px, rounded-full, --color-border, mx-auto mb-4

Restaurant name: Playfair Display SC, 22px, 700, text-stone-900
Tier badge: see tier colors table, rounded-full, 11px Karla 700 uppercase
Cuisine: 13px Karla 400, text-stone-500
Notes: 14px Karla 400 italic, text-stone-500, border-t, open-quote decorator
```

### CTA Button ("Open in Google Maps")

```css
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 11px 20px;
  margin-top: 16px;
  border-radius: var(--radius-md); /* 10px */
  background: #D97706;            /* amber-600 */
  color: white;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}
.cta:hover {
  background: #B45309;            /* amber-700 */
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px #FDE68A;  /* amber-200 focus ring */
}
```

> **WCAG AA:** amber-600 (#D97706) on white = 3.2:1. Fails for normal text, but the button
> text is 14px bold which meets AA large-text threshold. To be safe, use amber-700 (#B45309)
> as the base — it passes at 4.6:1.
>
> **Updated recommendation:** Use `#B45309` (amber-700) as the base button color for
> unambiguous WCAG AA compliance.

### Filter Chips (Epic 3)

```
Background (default): --color-surface
Border: 1.5px solid --color-border
Border-radius: rounded-full
Padding: px-3 py-1
Font: 12px Karla 600
Color: --color-text-secondary

Active state:
  Background: #D97706 (amber-600)
  Border: amber-600
  Color: white
```

### Secondary / Ghost Buttons

```
Secondary: --color-surface-warm bg, --color-accent text, --color-border border
Ghost: transparent bg, --color-text-secondary text, --color-border border
Border-radius: rounded-lg (8px)
Font: 13px Karla 700
```

---

## Micro-interactions

| Interaction | Effect |
|-------------|--------|
| Pin hover | `scale(1.2)`, 0.15s ease |
| Pin selected | Expands to 18px + ambient ring |
| CTA button hover | `translateY(-1px)` + shadow-md, 0.10s ease |
| Detail card entry | Slide up from bottom (translateY), 0.25s ease-out |
| Filter chip toggle | Background swap, 0.15s ease |

All transitions: CSS only, no animation libraries.

---

## Layout — Mobile-First

### App Shell

```
Full-height viewport: 100dvh
Column layout:
  1. Header (60px, fixed)
  2. Map (flex-1, fills remaining space)
  3. Detail card (position: fixed, bottom 0, full width, bottom sheet pattern)
```

### Desktop (≥ 768px)

```
Header spans full width (fixed)
Map: full width, height calc(100dvh - 60px)
Detail card: right-side panel, 360px wide, full height minus header
```

---

## Tailwind v4 Setup

Add font variables in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-display: 'Playfair Display SC', Georgia, serif;
  --font-sans: 'Karla', system-ui, sans-serif;

  --color-brand-bg: #FFFBF5;
  --color-brand-surface: #FFFFFF;
  --color-brand-surface-warm: #FFF8EE;
  --color-brand-border: #E8E0D5;
  --color-brand-border-light: #F0EBE3;
  --color-brand-accent: #B45309;
  --color-brand-cta: #D97706;
  --color-brand-cta-hover: #B45309;

  --color-tier-loved: #F59E0B;
  --color-tier-loved-bg: #FEF3C7;
  --color-tier-loved-text: #92400E;
  --color-tier-recommended: #3B82F6;
  --color-tier-recommended-bg: #DBEAFE;
  --color-tier-recommended-text: #1E40AF;
  --color-tier-radar: #10B981;
  --color-tier-radar-bg: #D1FAE5;
  --color-tier-radar-text: #065F46;
}
```

---

## SAFE / RISK Summary

| Decision | Status | Notes |
|----------|--------|-------|
| Playfair Display SC + Karla fonts | SAFE | Industry-standard for food brands |
| Warm off-white background (#FFFBF5) | SAFE | Subtle — users won't notice, cohesion is better |
| Amber CTA (#D97706 → use #B45309) | SAFE | Avoids blue collision with Recommended tier |
| Bottom-sheet card pattern | SAFE | Established pattern, Beli uses it |
| Micro-interactions (CSS only) | SAFE | No libraries, pure CSS transitions |
| Playfair Display SC with restaurant names | WATCH | Small-caps — test with actual data |
| Google Fonts CDN | WATCH | Add preconnect, consider self-hosting via fontsource |

---

## Research Sources

- **Beli** (beliapp.com): Minimal, white, utilitarian, map-first, no strong brand color
- **Eater** (eater.com): Bold red editorial, strong hierarchy, photo-heavy, high contrast
- **UI/UX Pro Max** (local, offline): Restaurant/Food Service category — recommended Playfair Display SC + Karla, warm amber palette, micro-interactions for map UX
- **Preview page**: `/tmp/design-consultation-preview-food-list.html`

---

*Last updated: 2026-03-29 — /design-consultation (gstack)*
