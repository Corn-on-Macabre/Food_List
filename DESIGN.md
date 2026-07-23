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

## Color Palette — "Wine & Paper"

Oxblood on cool greige paper. Reads like a wine list, not a chat window. Replaced the
original cream-and-amber palette 2026-07-23. Every color is a runtime CSS variable defined
on `:root` (light) and `.dark` (dark) in `src/index.css`, mapped to Tailwind utilities via
`@theme inline`. Components use only the semantic `brand-*` / `tier-*` / `state-*` utilities —
never raw Tailwind palette classes (the only exceptions are literals that sit on photos,
e.g. the white overlay buttons on card photos).

### App Chrome

| Token (utility suffix) | Light | Dark | Usage |
|-------|-------|------|-------|
| `brand-bg` | `#F4F2EE` | `#191316` | Page / app background (paper / wine-black) |
| `brand-surface` | `#FFFFFF` | `#221B1F` | Cards, panels, overlays, inactive chips |
| `brand-surface-warm` | `#EFEBE4` | `#281F24` | Highlighted surfaces, selected states |
| `brand-hover` | `#F6F3EF` | `#2C2328` | Hover fills on buttons/rows, soft neutral chips |
| `brand-border` | `#E0DBD5` | `#3B3136` | Dividers, card borders, inputs |
| `brand-border-light` | `#EBE7E2` | `#2E262A` | Subtle separators within cards |
| `brand-border-strong` | `#CBC3BD` | `#4E4148` | Hover borders on chips |
| `brand-text` | `#241E20` | `#F1EAEC` | Headings, primary text |
| `brand-text-muted` | `#6E6669` | `#ABA0A5` | Body, cuisine, meta |
| `brand-text-faint` | `#9C9497` | `#7E7378` | Placeholder, labels, decorative text |
| `brand-accent` / `brand-cta` / `brand-chip` | `#7D2A3C` | `#E38E9B` | Links, buttons, active chips (oxblood / rosé) |
| `brand-accent-hover` / `brand-cta-hover` | `#5E1F2D` | `#ECA9B4` | Hover state for the accent |
| `brand-on-accent` | `#FFF6F7` | `#2A1218` | Text on accent-filled buttons/chips |
| `brand-focus` | `#E9C6CE` | `#5C2833` | Keyboard focus ring |
| `brand-tint` | `#F6E9EC` | `#3A2229` | Soft wine chip/banner backgrounds |
| `brand-tint-border` | `#E5C6CE` | `#55333C` | Border on tinted chips/banners |
| `brand-tint-text` | `#82374A` | `#E4A0AC` | Text on tinted chips/banners |

### State Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `state-open` | `#059669` | `#34D399` | "Open now" |
| `state-closed` | `#E11D48` | `#FB7185` | "Closed" |
| `state-error` | `#DC2626` | `#F87171` | Errors, destructive buttons |
| `state-error-border` | `#FCA5A5` | `#9B3535` | Error borders |
| `state-error-tint` | `#FEF2F2` | `#3B1A1E` | Error banner backgrounds |

### Tier Colors — FIXED in light mode, never override

Light values are established in the data model and CLAUDE.md; dark mode brightens them so
pins carry on the dark map. Pins and the legend read `var(--loved)` etc., so they flip
automatically with the theme.

| Tier | Pin (light) | Pin (dark) | Badge BG (light/dark) | Badge Text (light/dark) |
|------|-----------|----------|----------|------------|
| Loved | `#F59E0B` | `#FBBF24` | `#FEF3C7` / `#3E2E08` | `#92400E` / `#FCD34D` |
| Recommended | `#3B82F6` | `#60A5FA` | `#DBEAFE` / `#1B3252` | `#1E40AF` / `#8FC0FA` |
| On My Radar | `#10B981` | `#34D399` | `#D1FAE5` / `#0B3B2E` | `#065F46` / `#4ADE9F` |

Accolade badges ("🏆 Recognized") intentionally stay gold (`tier-loved-*` tokens + a
`tier-loved-border` of `#F3CF8B` / `#6B5210`) — they're awards. Dish chips and info banners
use the wine `brand-tint` set instead.

> **Why oxblood for CTA instead of blue or green?** Blue is claimed by the Recommended tier
> and green by On My Radar. Oxblood clears all three tier hues, keeps the warm food-world
> feel, and doesn't read as the default AI-product amber.

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
| Meta / cuisine | Karla | `text-sm` | 400 | `text-brand-text-muted` |
| Badge text | Karla | `text-[11px]` | 700 uppercase | Letter-spacing 0.04em |
| UI labels | Karla | `text-[11px]` | 700 uppercase | Letter-spacing 0.1em, `text-brand-text-faint` |
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
Background: brand-bg/90 + backdrop-blur-sm (FROSTED_BAR)
Border: border-b with brand-border
Shadow: shadow-sm
Padding: px-5
Logo: Playfair Display SC, 20px, text-brand-text
Theme toggle: sun/moon icon button, right of admin links, left of UserMenu
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
Background: brand-bg/95 + backdrop-blur-sm
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

Restaurant name: Playfair Display SC, 22px, 700, text-brand-text
Tier badge: see tier colors table, rounded-full, 11px Karla 700 uppercase
Cuisine: 13px Karla 400, text-brand-text-muted
Notes: 14px Karla 400 italic, text-brand-text-muted, border-t, open-quote decorator
```

### CTA Button ("Open in Google Maps")

`BTN_PRIMARY` in `src/components/styles.ts`:

```
Background: bg-brand-cta        (light #7D2A3C oxblood / dark #E38E9B rosé)
Text: text-brand-on-accent      (light #FFF6F7 / dark #2A1218)
Hover: bg-brand-cta-hover + translateY(-1px) + shadow-md
Focus: ring-2 ring-brand-focus
Radius: rounded-lg, Font: 14px Karla 700
```

> **WCAG AA:** `#7D2A3C` on white = 8.9:1 and on `#F4F2EE` paper = 8.0:1 — passes for all
> text sizes. Dark-mode rosé `#E38E9B` carries dark text (`#2A1218`, 7.6:1) instead of white.

### Filter Chips (Epic 3)

```
Background (default): brand-surface
Border: 1.5px solid brand-border (hover: brand-border-strong)
Border-radius: rounded-full
Padding: px-3 py-1
Font: 12px Karla 600
Color: brand-text-muted

Active state:
  Background: brand-chip (oxblood / rosé)
  Border: brand-chip
  Color: brand-on-accent
```

### Secondary / Ghost Buttons

```
Secondary: brand-surface bg, brand-text-muted text, brand-border border, hover brand-hover bg
Ghost: transparent bg, brand-text-muted text, brand-border border
Danger: state-error text + state-error-border border, hover state-error-tint bg
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

## Dark Mode

Follows the OS by default; the header sun/moon toggle persists an explicit override in
`localStorage['food-list-theme']`.

- **Mechanism:** `.dark` class on `<html>` swaps the runtime CSS variables — components need
  no `dark:` variants because everything routes through the semantic tokens. A
  `@custom-variant dark` is defined for the rare case that needs one.
- **State:** `src/hooks/useTheme.ts` (`useSyncExternalStore`, module store, no provider).
  Listens to `prefers-color-scheme` changes while no override is stored.
- **No flash:** an inline script in `index.html` applies `.dark` before first paint, and
  `theme-color` metas are media-scoped (collapsed to the chosen color on manual toggle).
- **Map:** `colorScheme` is an init-only Maps API option, so `<Map key={theme} colorScheme=...>`
  remounts on toggle. Pins, legend, and cluster bubbles read CSS variables and flip with the
  theme (the selected-pin ambient ring uses `color-mix()` so it works with `var()` colors).
- **Never** hard-code a literal color that must invert; the only allowed literals sit on
  photos (white overlay buttons, scrims), which don't change with theme.

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

The theme architecture in `src/index.css` (see that file for the full token list):

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root  { color-scheme: light; --bg: #F4F2EE; --accent: #7D2A3C; /* … light values */ }
.dark  { color-scheme: dark;  --bg: #191316; --accent: #E38E9B; /* … dark values */ }

@theme inline {
  --font-display: 'Playfair Display SC', Georgia, serif;
  --font-sans: 'Karla', system-ui, sans-serif;
  /* utilities point at the runtime vars, so they flip with .dark */
  --color-brand-bg: var(--bg);
  --color-brand-accent: var(--accent);
  /* … one mapping per token in the palette tables above */
}
```

`@theme inline` (not plain `@theme`) is what makes the utilities reference the runtime
variables instead of baking in static values.

> ⚠️ Never write a `*/` sequence (e.g. `brand-*/tier-*`) inside a CSS comment — it
> terminates the comment and the parser silently discards the next rule block. This once
> swallowed the entire `:root` token block and killed every light-mode color.

---

## SAFE / RISK Summary

| Decision | Status | Notes |
|----------|--------|-------|
| Playfair Display SC + Karla fonts | SAFE | Industry-standard for food brands |
| Greige paper background (#F4F2EE) | SAFE | Cooler than the old cream; still warm, not clinical |
| Oxblood CTA/accent (#7D2A3C) | SAFE | Clears all three tier hues; 8.9:1 on white |
| Rosé dark-mode accent (#E38E9B) + dark on-accent text | SAFE | Light accents need dark text, not white |
| Dark mode via runtime CSS vars + `.dark` class | SAFE | No per-component `dark:` variants to maintain |
| Map remount on theme toggle | WATCH | Resets camera to city center — acceptable for a rare action |
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

*Last updated: 2026-07-23 — Rebrand to "Wine & Paper" (oxblood on greige paper) + full dark
mode. All colors are runtime CSS variables on `:root`/`.dark` mapped via `@theme inline` in
`src/index.css`; shared component classes live in `src/components/styles.ts`; theme state in
`src/hooks/useTheme.ts`. Tier pin colors unchanged in light mode, brightened in dark.*

*Previously: 2026-07-13 — UI overhaul: amber system fully implemented. 2026-03-29 —
/design-consultation (gstack). Map tile style instructions: `deploy/map-style-console-setup.md`.*
