/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  // VITE_GOOGLE_MAPS_API_KEY must have "Places API (New)" enabled in GCP console.
  // A separate key is optional; the same key works if Places API is enabled.
  readonly VITE_GOOGLE_MAPS_PLACES_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
