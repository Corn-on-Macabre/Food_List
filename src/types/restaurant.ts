export type Tier = "loved" | "recommended" | "on_my_radar";

export interface Restaurant {
  id: string;           // URL-safe slug (e.g., "pho-43")
  name: string;
  tier: Tier;
  cuisine: string;
  lat: number;
  lng: number;
  notes?: string;
  googleMapsUrl: string;
  source?: string;
  dateAdded: string;    // ISO date string YYYY-MM-DD
  tags?: string[];      // Occasion/vibe tags (e.g., ["date night", "patio"])
  featured?: boolean;   // Bobby's Pick badge
  enrichedAt?: string;  // ISO date — set by enrichment pipeline (Epic 5)
  rating?: number;             // Google Places rating (1.0–5.0)
  userRatingCount?: number;    // Google Places total review count
  priceLevel?: string;         // e.g. "PRICE_LEVEL_MODERATE"
  photoRef?: string;           // Places photo resource name
  suggested_by?: string;       // Display name of the user who suggested it
  suggested_by_avatar?: string; // Avatar URL of the suggester
}

export interface FilterState {
  cuisine: string | null;
  tier: Tier | null;
  maxDistance: number | null;
  searchTerm: string | null;
}
