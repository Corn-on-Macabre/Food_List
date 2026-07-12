export interface MetroRegion {
  id: string;
  label: string;
  center: { lat: number; lng: number };
  zoom: number;
  radius: number; // miles — used by backfill script only
}

export const METRO_REGIONS: MetroRegion[] = [
  { id: 'phoenix', label: 'Phoenix', center: { lat: 33.4484, lng: -112.0740 }, zoom: 11, radius: 60 },
  { id: 'dallas', label: 'Dallas', center: { lat: 32.7767, lng: -96.7970 }, zoom: 11, radius: 50 },
  { id: 'chicago', label: 'Chicago', center: { lat: 41.8781, lng: -87.6298 }, zoom: 11, radius: 40 },
  { id: 'se-connecticut', label: 'SE Connecticut', center: { lat: 41.3556, lng: -72.0995 }, zoom: 11, radius: 30 },
  { id: 'wichita', label: 'Wichita', center: { lat: 37.6872, lng: -97.3301 }, zoom: 12, radius: 30 },
  { id: 'hartford', label: 'Hartford', center: { lat: 41.7658, lng: -72.6734 }, zoom: 12, radius: 25 },
  { id: 'nyc', label: 'New York City', center: { lat: 40.7128, lng: -74.0060 }, zoom: 12, radius: 30 },
  { id: 'paris', label: 'Paris', center: { lat: 48.8566, lng: 2.3522 }, zoom: 13, radius: 20 },
];

export const DEFAULT_METRO_ID = 'phoenix';
