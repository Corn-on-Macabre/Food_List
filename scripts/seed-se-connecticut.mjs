#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const DRY_RUN = process.argv.includes('--dry-run');
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
const today = new Date().toISOString().slice(0, 10);

// Look up real coordinates via Google Places
async function lookupCoords(name, approxLat, approxLng) {
  if (!API_KEY) return null;
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.location,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery: name,
        maxResultCount: 1,
        locationBias: { circle: { center: { latitude: approxLat, longitude: approxLng }, radius: 50000 } },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place?.location) return null;
    return { lat: place.location.latitude, lng: place.location.longitude, googleMapsUrl: place.googleMapsUri || null };
  } catch { return null; }
}

const restaurants = [
  // === MYSTIC (7) ===
  {
    id: "shipwrights-daughter-mystic-ct",
    name: "The Shipwright's Daughter",
    cuisine: "Seafood",
    lat: 41.3545, lng: -71.9663,
    notes: "James Beard Award-winning chef. NYT top dining destination. Sustainably sourced seafood, seasonal menu.",
    tags: ["date night", "must-try"]
  },
  {
    id: "rocks-21-mystic-ct",
    name: "Rocks 21",
    cuisine: "Seafood",
    lat: 41.3540, lng: -71.9650,
    notes: "Waterfront views. Lobster nachos and fisherman's platter with local bay scallops.",
    tags: ["team dinner", "patio"]
  },
  {
    id: "mystic-pizza-ct",
    name: "Mystic Pizza",
    cuisine: "Pizza",
    lat: 41.3544, lng: -71.9665,
    notes: "Yes, THAT Mystic Pizza from the Julia Roberts movie. Iconic. The pizza is actually good.",
    tags: ["quick lunch", "must-try"]
  },
  {
    id: "sea-swirl-mystic-ct",
    name: "Sea Swirl",
    cuisine: "Seafood",
    lat: 41.3490, lng: -71.9870,
    notes: "Seasonal clam shack, 50+ years family-owned. Famous fried clams and sunset views over Mystic River.",
    tags: ["quick lunch", "must-try"]
  },
  {
    id: "seaview-snack-bar-mystic-ct",
    name: "Seaview Snack Bar",
    cuisine: "Seafood",
    lat: 41.3200, lng: -71.9730,
    notes: "Classic sea shack. Fried clam platters and lobster rolls with sweet mayo and claw meat.",
    tags: ["quick lunch"]
  },
  {
    id: "mystic-fish-camp-ct",
    name: "Mystic Fish Camp",
    cuisine: "Seafood",
    lat: 41.3550, lng: -71.9660,
    notes: "Local seafood with imaginative comfort food twists. Nautical-inspired decor, daily specials.",
    tags: ["team dinner"]
  },
  {
    id: "the-mariner-mystic-ct",
    name: "The Mariner",
    cuisine: "Seafood",
    lat: 41.3548, lng: -71.9670,
    notes: "Classic seafood and steak. CT-style lobster rolls with warm butter on toasted split-top buns.",
    tags: ["team dinner"]
  },

  // === NEW LONDON (5) ===
  {
    id: "la-luna-ristorante-new-london-ct",
    name: "La Luna Ristorante",
    cuisine: "Italian",
    lat: 41.3555, lng: -72.0998,
    notes: "Downtown. Italian-American with creative cooking. Great happy hour Mon-Fri with free appetizer.",
    tags: ["team dinner", "date night"]
  },
  {
    id: "on-the-waterfront-new-london-ct",
    name: "On The Waterfront",
    cuisine: "Seafood",
    lat: 41.3550, lng: -72.0930,
    notes: "Family-run. Thames River views from every seat. Outdoor patio in summer.",
    tags: ["team dinner", "patio"]
  },
  {
    id: "social-bar-kitchen-new-london-ct",
    name: "The Social Bar + Kitchen",
    cuisine: "American",
    lat: 41.3560, lng: -72.1000,
    notes: "50 craft beers on draft — largest selection in SE Connecticut. Handcrafted burgers and cocktails.",
    tags: ["team dinner", "quick lunch"]
  },
  {
    id: "thames-landing-oyster-bar-new-london-ct",
    name: "Thames Landing Oyster Bar",
    cuisine: "Seafood",
    lat: 41.3552, lng: -72.0940,
    notes: "State Street. Raw bar and fresh oysters. New London's waterfront gem.",
    tags: ["date night"]
  },
  {
    id: "fisherman-restaurant-groton-ct",
    name: "Fisherman Restaurant",
    cuisine: "Seafood",
    lat: 41.3500, lng: -72.0780,
    notes: "Groton shoreline. Diverse menu with fabulous fish and chips. Water views from every seat.",
    tags: ["team dinner"]
  },

  // === NORWICH (4) ===
  {
    id: "canggio-norwich-ct",
    name: "Canggio Restaurant",
    cuisine: "Italian",
    lat: 41.5240, lng: -72.0760,
    notes: "Top-rated in Norwich. Upscale Italian with fresh pasta.",
    tags: ["date night", "team dinner"]
  },
  {
    id: "fat-cat-grill-norwich-ct",
    name: "Fat Cat Grill",
    cuisine: "American",
    lat: 41.5450, lng: -72.0890,
    notes: "Best burgers and BBQ in Norwich. Famous BBQ Burger plus lobster alfredo and chicken parm.",
    tags: ["quick lunch"]
  },
  {
    id: "these-guys-brewing-norwich-ct",
    name: "These Guys Brewing Company",
    cuisine: "American",
    lat: 41.5260, lng: -72.0770,
    notes: "Norwich brewpub. House-brewed beers with solid pub food.",
    tags: ["team dinner"]
  },
  {
    id: "prime-82-norwich-ct",
    name: "Prime 82",
    cuisine: "Steakhouse",
    lat: 41.5250, lng: -72.0780,
    notes: "Norwich steakhouse. Premium cuts in a polished setting.",
    tags: ["team dinner"]
  },

  // === WATERFORD (2) ===
  {
    id: "ocean-pizza-waterford-ct",
    name: "Ocean Pizza",
    cuisine: "Pizza",
    lat: 41.3440, lng: -72.1350,
    notes: "Waterford. Many options, consistently delicious pizza.",
    tags: ["quick lunch"]
  },
  {
    id: "farm-italy-mohegan-sun-ct",
    name: "The Farm Italy Restaurant & Bar",
    cuisine: "Italian",
    lat: 41.4920, lng: -72.0870,
    notes: "Inside Mohegan Sun. Nominated Best Italian in CT. Handcrafted pasta, premium steaks, vibrant vibe.",
    tags: ["team dinner", "date night"]
  },
];

// Look up real coordinates for each restaurant
console.log(`Looking up real coordinates for ${restaurants.length} restaurants...\n`);
for (let i = 0; i < restaurants.length; i++) {
  const r = restaurants[i];
  process.stdout.write(`[${i+1}/${restaurants.length}] ${r.name}...`);
  const result = await lookupCoords(r.name, r.lat, r.lng);
  if (result) {
    r.lat = result.lat;
    r.lng = result.lng;
    if (result.googleMapsUrl) r.googleMapsUrl = result.googleMapsUrl;
    console.log(` (${r.lat}, ${r.lng})`);
  } else {
    r.googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(r.name)}`;
    console.log(' (kept estimate)');
  }
  if (i < restaurants.length - 1) await new Promise(res => setTimeout(res, 200));
}

const allNew = restaurants.map(r => ({
  ...r,
  googleMapsUrl: r.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(r.name)}`,
  tier: "on_my_radar",
  dateAdded: today,
  source: "web research",
}));

const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const existingIds = new Set(existing.map(r => r.id));
const toInsert = allNew.filter(r => !existingIds.has(r.id));

console.log(`\n${toInsert.length} new restaurants (${allNew.length - toInsert.length} already exist)`);

if (DRY_RUN) {
  toInsert.forEach(r => console.log(`  + ${r.id}: ${r.name} (${r.cuisine})`));
  process.exit(0);
}

existing.push(...toInsert);
fs.writeFileSync(JSON_PATH, JSON.stringify(existing, null, 2));
console.log(`Wrote to restaurants.json (total: ${existing.length})`);

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_URL && SERVICE_ROLE_KEY) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('restaurants').insert(toInsert).select('id');
  if (error) { console.error('Supabase insert failed:', error.message); process.exit(1); }
  console.log(`Inserted ${data.length} into Supabase.`);
}

console.log(`Run 'node scripts/enrich-places.mjs' next.`);
