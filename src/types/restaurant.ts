export type Tier = "loved" | "recommended" | "on_my_radar";

export interface Restaurant {
  id: string;           // URL-safe slug (e.g., "pho-43")
  name: string;
  tier: Tier;
  cuisine: string;
  city: string;         // Metro region id (e.g., "phoenix", "dallas")
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
  googlePlaceId?: string;      // Stable Places resource id (e.g. "ChIJ...")
  address?: string;            // Formatted street address from Places
  website?: string;
  phone?: string;              // National format, e.g. "(623) 877-5007"
  businessStatus?: string;     // e.g. "OPERATIONAL", "CLOSED_PERMANENTLY"
  openingHours?: OpeningHours;
  lastVisited?: string;        // ISO date — set by the MCP log_visit tool
  dishes?: string[];           // Standout dishes recorded via log_visit
  accolades?: Accolade[];      // Press/community recognition (badges + filter)
}

export interface Accolade {
  source: string;    // e.g. "Phoenix New Times"
  list?: string;     // e.g. "50 Best"
  year?: number;
  category?: string; // e.g. "Neighborhood Favorites"
  url?: string;
}

export interface OpeningHours {
  periods: OpeningPeriod[];
  weekdayDescriptions: string[]; // Human-readable, e.g. "Monday: 12:00 – 10:00 PM"
}

export interface OpeningPeriod {
  open: { day: number; hour: number; minute: number };  // day: 0 = Sunday
  close?: { day: number; hour: number; minute: number }; // absent = open 24/7
}

export interface FilterState {
  city: string | null;
  cuisine: string | null;
  tier: Tier | null;
  maxDistance: number | null;
  searchTerm: string | null;
  openNow: boolean;
  tags: string[];
  recognized: boolean;
}
