# Google Cloud Console — map style setup (light + dark)

The registered map ID is **`f1de4e716bd1afb992c78c8e`** (display name "food-list-map",
vector, tilt/rotation off), wired into `src/App.tsx` as the `mapId` prop. Note: the
`mapId` prop must be the hex Map ID, not the display name.

A map ID supports **one light style and one dark style**. The app passes
`colorScheme: 'DARK'` when the theme toggle is dark — without a dark style associated,
Google serves its stock dark base map, which ignores every rule below (including the
critical business-POI hiding).

Two styles to publish (2026-07-23 Wine & Paper rebrand — replaces `bobby-menu-warm-paper`
from 2026-07-13):

| Style name | JSON | Associate as |
|---|---|---|
| `bobby-menu-wine-paper` | [`deploy/map-style.json`](./map-style.json) | Light style on `food-list-map` |
| `bobby-menu-wine-dark` | [`deploy/map-style-dark.json`](./map-style-dark.json) | Dark style on `food-list-map` |

## Fast path — JSON (preferred)

For **each** of the two JSON files: the Create Style dialog has a **JSON** tab (new
Google Maps styling JSON format). Paste the file contents, confirm the preview shifts
(greige paper tones for light, wine-black for dark), click **Customize**, name the style
(`bobby-menu-wine-paper` / `bobby-menu-wine-dark`), then **Save → Publish**. Finally, in
**Map Management** open `food-list-map` and associate the light style in the light slot
and the dark style in the dark slot (step 7 below). If the editor rejects an individual
rule, delete just that rule — none depend on each other.

## Manual editor steps (fallback)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and select the
   project that owns `VITE_GOOGLE_MAPS_API_KEY`.
2. Left nav: **Google Maps Platform → Map Styles** → **Create Style**.
   (If "Map Styles" is missing, look under **Maps → Styles** — Google reshuffles this UI often.)
3. Start from the **Simple** base → **Customize style**. Name it `bobby-menu-warm-paper`.
4. If the newer atmosphere editor appears first, set: **POI density: Low**,
   **Transit: Off**, **Landmarks: Off**. Then open the advanced feature/element editor.
5. Apply these feature → element values:

Light style values (`bobby-menu-wine-paper`) — dark values in parentheses
(`bobby-menu-wine-dark`):

| Feature | Element | Value |
|---|---|---|
| Landscape → Natural | Geometry fill | `#EDEAE4` (dark `#211A1E`) — one step deeper than the UI paper `#F4F2EE` so cards read elevated |
| Landscape → Human-made | Geometry fill | `#E9E5DD` (dark `#261E23`) |
| Water | Geometry fill | `#C6D8D2` (dark `#1C2B29`) — muted sage, deliberately not Google blue; avoids fighting the Recommended-tier blue |
| Water | Labels → Text fill | `#75988C` (dark `#5F7A72`) |
| **POI → Business** | **Visibility** | **Off in both styles** — critical: hides Google's own restaurant pins so tier pins are the only food marks |
| POI (all others) | Icons / labels | Off or minimum density |
| POI → Parks | Geometry fill | `#DAE4D2` (dark `#243029`) |
| POI → Parks | Labels → Text fill | `#8CA080` (dark `#6E8A7C`), text stroke = land fill |
| Roads → Highway | Geometry fill / stroke | `#ECE6DB` / `#DCD3C7` (dark `#362B31` / `#423439`) |
| Roads → Arterial | Geometry fill / stroke | `#FFFFFF` / `#E0DBD5` (dark `#2F262B` / `#3B3136`) |
| Roads → Local | Geometry fill / stroke | `#FFFFFF` / `#EBE7E2` (dark `#2A2226` / `#332A2F`) |
| Roads (all) | Labels → Text fill / stroke | `#9C9497` / `#F4F2EE` (dark `#7E7378` / `#191316`) |
| Transit | Visibility | Off |
| Administrative → Locality | Labels → Text fill / stroke | `#6E6669` / `#F4F2EE` (dark `#ABA0A5` / `#191316`) |

(An `Administrative → stateOrProvince` geometry-stroke rule was in earlier versions but the
console's JSON editor rejects it — omitted; the default boundary rendering is fine.)

6. **Save → Publish** the style.
7. **Google Maps Platform → Map Management (Map IDs)** → open the map ID
   **`food-list-map`** (create it as type **JavaScript**, vector recommended, if it
   doesn't exist) → under **Map style**, associate `bobby-menu-warm-paper` → **Save**.
8. Reload the app. Propagation can take a few minutes — if tiles still look default
   right after publishing, wait before debugging anything in code.

## Verify

- Light: tiles are greige paper toned, harmonizing with the app's `#F4F2EE` chrome.
- Dark (flip the in-app theme toggle): tiles are wine-black (`#211A1E` land), not
  Google's stock navy dark map.
- In **both** themes: no Google business POI pins (restaurants/shops/landmarks)
  compete with the tier dots.
- Water reads sage/muted teal, not saturated blue.
