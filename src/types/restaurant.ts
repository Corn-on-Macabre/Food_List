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
}

export interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;
}
