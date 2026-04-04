#!/usr/bin/env node
// Converts Google Takeout CSV lists → public/restaurants.json
//
// Sources:
//   Favorite places.csv  → tier: loved
//   Worth Recommending.csv → tier: recommended
//   Want to go.csv       → tier: on_my_radar (filtered to PHX metro)
//
// Uses Places API (New) for coordinates + cuisine type.
// Enable it at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
//
// Usage: node scripts/import-lists.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load API key from .env
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) { console.error('No VITE_GOOGLE_MAPS_API_KEY in .env'); process.exit(1); }

const LISTS = [
  { file: '/Users/rhunnicutt/Downloads/Takeout 2/Saved/Favorite places.csv', tier: 'loved' },
  { file: '/Users/rhunnicutt/Downloads/Takeout 2/Saved/Worth Recommending.csv', tier: 'recommended' },
  { file: '/Users/rhunnicutt/Downloads/Takeout 2/Saved/Want to go.csv', tier: 'on_my_radar' },
];

const OUTPUT = path.join(ROOT, 'public/restaurants.json');

// Phoenix metro bounding box — filters out non-PHX entries in "Want to go"
const PHX_BOUNDS = { minLat: 33.0, maxLat: 34.0, minLng: -113.0, maxLng: -111.0 };

// Maps Google place types → clean cuisine label (first match wins)
const CUISINE_TYPE_MAP = [
  ['japanese_restaurant', 'Japanese'],
  ['sushi_restaurant', 'Japanese'],
  ['ramen_restaurant', 'Japanese'],
  ['mexican_restaurant', 'Mexican'],
  ['italian_restaurant', 'Italian'],
  ['pizza_restaurant', 'Italian'],
  ['american_restaurant', 'American'],
  ['hamburger_restaurant', 'American'],
  ['steak_house', 'American'],
  ['barbecue_restaurant', 'BBQ'],
  ['thai_restaurant', 'Thai'],
  ['chinese_restaurant', 'Chinese'],
  ['dim_sum_restaurant', 'Chinese'],
  ['indian_restaurant', 'Indian'],
  ['vietnamese_restaurant', 'Vietnamese'],
  ['mediterranean_restaurant', 'Mediterranean'],
  ['greek_restaurant', 'Mediterranean'],
  ['middle_eastern_restaurant', 'Middle Eastern'],
  ['korean_restaurant', 'Korean'],
  ['french_restaurant', 'French'],
  ['seafood_restaurant', 'Seafood'],
  ['spanish_restaurant', 'Spanish'],
  ['breakfast_restaurant', 'American'],
  ['brunch_restaurant', 'American'],
  ['sandwich_shop', 'American'],
  ['fast_food_restaurant', 'American'],
  ['cafe', 'Cafe'],
  ['coffee_shop', 'Cafe'],
  ['bakery', 'Bakery'],
  ['bar', 'Bar'],
];

// Types that indicate this is a food/drink establishment (not a car shop, etc.)
const FOOD_TYPES = new Set([
  'restaurant', 'food', 'meal_delivery', 'meal_takeaway', 'bar', 'cafe',
  'bakery', 'coffee_shop', 'ice_cream_shop', 'dessert_shop', 'juice_bar',
  ...CUISINE_TYPE_MAP.map(([t]) => t),
]);

function isFood(types) {
  return types.some((t) => FOOD_TYPES.has(t));
}

function inPhxBounds(lat, lng) {
  return lat >= PHX_BOUNDS.minLat && lat <= PHX_BOUNDS.maxLat
    && lng >= PHX_BOUNDS.minLng && lng <= PHX_BOUNDS.maxLng;
}

function cuisineFromTypes(types) {
  for (const [googleType, label] of CUISINE_TYPE_MAP) {
    if (types.includes(googleType)) return label;
  }
  return 'Other';
}

// Extract the hex place fingerprint from the Maps URL for deduplication
function extractPlaceKey(url) {
  const match = url.match(/1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  return match?.[1] ?? url; // fall back to full URL
}

// Minimal CSV parser that handles quoted fields
function parseCsv(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = [];
    let inQuote = false;
    let current = '';
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuote && line[j + 1] === '"') { current += '"'; j++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeUniqueId(name, usedIds) {
  const base = slugify(name);
  if (!usedIds.has(base)) { usedIds.add(base); return base; }
  let n = 2;
  while (usedIds.has(`${base}-${n}`)) n++;
  usedIds.add(`${base}-${n}`);
  return `${base}-${n}`;
}

async function lookupPlace(name, mapsUrl) {
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.location,places.types,places.displayName',
      },
      body: JSON.stringify({ textQuery: name, maxResultCount: 1 }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      if (err.includes('SERVICE_DISABLED') || err.includes('API_NOT_ACTIVATED')) {
        console.error('\n\nERROR: Places API (New) is not enabled.');
        console.error('Enable it at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
        process.exit(1);
      }
      return null;
    }

    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return null;

    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    const types = place.types ?? [];
    return { lat, lng, types };
  } catch {
    return null;
  }
}

async function main() {
  const seenPlaceKeys = new Set(); // dedup across lists
  const usedIds = new Set();
  const restaurants = [];
  let skippedNonFood = 0;
  let skippedOutsidePHX = 0;
  let skippedDuplicate = 0;
  let skippedNoResult = 0;

  for (const { file, tier } of LISTS) {
    const listName = path.basename(file, '.csv');
    const rows = parseCsv(fs.readFileSync(file, 'utf8'));
    // Skip blank rows (the CSV has an empty row 2)
    const entries = rows.filter((r) => r.Title?.trim());

    console.log(`\n── ${listName} (${entries.length} entries, tier: ${tier}) ──`);

    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      const name = row.Title.trim();
      const note = row.Note?.trim() || null;
      const mapsUrl = row.URL?.trim() || '';
      const placeKey = extractPlaceKey(mapsUrl);

      // Dedup: skip if already added from a higher-priority list
      if (seenPlaceKeys.has(placeKey)) {
        skippedDuplicate++;
        continue;
      }

      process.stdout.write(`  [${i + 1}/${entries.length}] ${name}...`);

      const result = await lookupPlace(name, mapsUrl);

      if (!result) {
        console.log(' (no result)');
        skippedNoResult++;
        seenPlaceKeys.add(placeKey);
        continue;
      }

      const { lat, lng, types } = result;

      // Skip non-food establishments
      if (!isFood(types)) {
        console.log(` (not food: ${types.slice(0, 3).join(', ')})`);
        skippedNonFood++;
        seenPlaceKeys.add(placeKey);
        continue;
      }

      // For on_my_radar, enforce PHX metro bounds
      if (tier === 'on_my_radar' && !inPhxBounds(lat, lng)) {
        console.log(` (outside PHX: ${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        skippedOutsidePHX++;
        seenPlaceKeys.add(placeKey);
        continue;
      }

      const cuisine = cuisineFromTypes(types);
      console.log(` ${cuisine}`);

      seenPlaceKeys.add(placeKey);

      const entry = {
        id: makeUniqueId(name, usedIds),
        name,
        tier,
        cuisine,
        lat,
        lng,
        googleMapsUrl: mapsUrl || `https://www.google.com/maps/search/?q=${encodeURIComponent(name)}`,
        dateAdded: new Date().toISOString().split('T')[0],
      };
      if (note) entry.notes = note;
      restaurants.push(entry);

      await new Promise((r) => setTimeout(r, 150));
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(restaurants, null, 2));

  // Summary
  const byTier = { loved: 0, recommended: 0, on_my_radar: 0 };
  const byCuisine = {};
  for (const r of restaurants) {
    byTier[r.tier]++;
    byCuisine[r.cuisine] = (byCuisine[r.cuisine] ?? 0) + 1;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✓ Wrote ${restaurants.length} restaurants to public/restaurants.json`);
  console.log(`\n  Skipped (non-food):       ${skippedNonFood}`);
  console.log(`  Skipped (outside PHX):    ${skippedOutsidePHX}`);
  console.log(`  Skipped (duplicate):      ${skippedDuplicate}`);
  console.log(`  Skipped (no API result):  ${skippedNoResult}`);
  console.log('\nTier breakdown:');
  console.log(`  loved:        ${byTier.loved}`);
  console.log(`  recommended:  ${byTier.recommended}`);
  console.log(`  on_my_radar:  ${byTier.on_my_radar}`);
  console.log('\nCuisine breakdown:');
  Object.entries(byCuisine).sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c.padEnd(22)} ${n}`));
}

main().catch((err) => { console.error(err); process.exit(1); });
