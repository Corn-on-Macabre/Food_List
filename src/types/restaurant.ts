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
}

export interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;
}
