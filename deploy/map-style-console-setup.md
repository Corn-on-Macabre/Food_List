# Google Cloud Console — "warm paper" map style setup

One-time manual step, completed 2026-07-13. The registered map ID is
**`f1de4e716bd1afb992c78c8e`** (display name "food-list-map", vector, tilt/rotation off),
wired into `src/App.tsx` as the `mapId` prop. The published style `bobby-menu-warm-paper`
(JSON: [`deploy/map-style.json`](./map-style.json)) is associated with that map ID, which
restyles the tiles in production and dev simultaneously. Note: the `mapId` prop must be
the hex Map ID, not the display name.

## Fast path — JSON (preferred)

The Create Style dialog has a **JSON** tab (new Google Maps styling JSON format).
Paste the contents of [`deploy/map-style.json`](./map-style.json) there, confirm the
preview shifts to warm paper tones, click **Customize**, name the style
`bobby-menu-warm-paper`, then **Save → Publish** and continue at step 7 below
(bind to the `food-list-map` map ID). If the editor rejects an individual rule,
delete just that rule — none depend on each other.

## Manual editor steps (fallback)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and select the
   project that owns `VITE_GOOGLE_MAPS_API_KEY`.
2. Left nav: **Google Maps Platform → Map Styles** → **Create Style**.
   (If "Map Styles" is missing, look under **Maps → Styles** — Google reshuffles this UI often.)
3. Start from the **Simple** base → **Customize style**. Name it `bobby-menu-warm-paper`.
4. If the newer atmosphere editor appears first, set: **POI density: Low**,
   **Transit: Off**, **Landmarks: Off**. Then open the advanced feature/element editor.
5. Apply these feature → element values:

| Feature | Element | Value |
|---|---|---|
| Landscape → Natural | Geometry fill | `#F7F1E5` (paper — one step deeper than the UI cream `#FFFBF5` so cards read elevated) |
| Landscape → Human-made | Geometry fill | `#F3ECDE` |
| Water | Geometry fill | `#C7DCD5` (muted sage — deliberately not Google blue; avoids fighting the Recommended-tier blue) |
| Water | Labels → Text fill | `#7A9B90` |
| **POI → Business** | **Visibility** | **Off** — critical: hides Google's own restaurant pins so tier pins are the only food marks |
| POI (all others) | Icons / labels | Off or minimum density |
| POI → Parks | Geometry fill | `#DDE8D2` |
| POI → Parks | Labels → Text fill | `#8FA383`, text stroke `#F7F1E5` |
| Roads → Highway | Geometry fill / stroke | `#F2E3C8` / `#E4D2B2` |
| Roads → Arterial | Geometry fill / stroke | `#FFFFFF` / `#E8E0D5` |
| Roads → Local | Geometry fill / stroke | `#FFFFFF` / `#F0EBE3` |
| Roads (all) | Labels → Text fill / stroke | `#A8A29E` / `#FFFBF5` |
| Transit | Visibility | Off |
| Administrative → Locality | Labels → Text fill / stroke | `#78716C` / `#FFFBF5` |
| Administrative | Geometry stroke | `#D9CFC0` |

6. **Save → Publish** the style.
7. **Google Maps Platform → Map Management (Map IDs)** → open the map ID
   **`food-list-map`** (create it as type **JavaScript**, vector recommended, if it
   doesn't exist) → under **Map style**, associate `bobby-menu-warm-paper` → **Save**.
8. Reload the app. Propagation can take a few minutes — if tiles still look default
   right after publishing, wait before debugging anything in code.

## Verify

- Tiles are cream/paper toned, harmonizing with the app's `#FFFBF5` chrome.
- No Google business POI pins (restaurants/shops) compete with the tier dots.
- Water reads sage, not saturated blue.
