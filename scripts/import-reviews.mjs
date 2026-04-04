#!/usr/bin/env node
// Converts Google Takeout Reviews.json → public/restaurants.json
// Uses Places API (New) to look up cuisine type for each restaurant.
//
// Usage: node scripts/import-reviews.mjs
// Requires: VITE_GOOGLE_MAPS_API_KEY in .env (already set)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load API key from .env
const envPath = path.join(ROOT, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) {
  console.error('No VITE_GOOGLE_MAPS_API_KEY found in .env');
  process.exit(1);
}

const INPUT = '/Users/rhunnicutt/Downloads/Takeout/Maps (your places)/Reviews.json';
const OUTPUT = path.join(ROOT, 'public/restaurants.json');

// Maps Google place types → clean cuisine labels (first match wins)
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
  ['brunch_restaurant', 'American'],
  ['breakfast_restaurant', 'American'],
  ['sandwich_shop', 'American'],
  ['fast_food_restaurant', 'American'],
];

function ratingToTier(rating) {
  if (rating >= 5) return 'loved';
  if (rating >= 4) return 'recommended';
  return 'on_my_radar';
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeUniqueId(name, usedIds) {
  const base = slugify(name);
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }
  let n = 2;
  while (usedIds.has(`${base}-${n}`)) n++;
  usedIds.add(`${base}-${n}`);
  return `${base}-${n}`;
}

async function getCuisine(name, address) {
  const query = `${name} ${address}`;
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.types',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });

    if (!response.ok) {
      const err = await response.text();
      // If Places API (New) not enabled, print a clear message
      if (err.includes('SERVICE_DISABLED') || err.includes('API_NOT_ACTIVATED')) {
        console.error('\n\nERROR: Places API (New) is not enabled on your Google Cloud project.');
        console.error('Enable it at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
        process.exit(1);
      }
      return 'Other';
    }

    const data = await response.json();
    const types = data.places?.[0]?.types ?? [];

    for (const [googleType, cuisineLabel] of CUISINE_TYPE_MAP) {
      if (types.includes(googleType)) return cuisineLabel;
    }
    return 'Other';
  } catch {
    return 'Other';
  }
}

async function main() {
  const input = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const features = input.features;

  // Filter: 3+ stars, must have a name, skip 0,0 coordinates
  const eligible = features.filter((f) => {
    const rating = f.properties.five_star_rating_published;
    const [lng, lat] = f.geometry.coordinates;
    return rating >= 3 && f.properties.location?.name && (lat !== 0 || lng !== 0);
  });

  console.log(`Found ${features.length} total reviews → ${eligible.length} eligible (3+ stars, valid location)`);
  console.log('Looking up cuisine types via Places API...\n');

  const restaurants = [];
  const usedIds = new Set();

  for (let i = 0; i < eligible.length; i++) {
    const f = eligible[i];
    const props = f.properties;
    const [lng, lat] = f.geometry.coordinates; // GeoJSON is [lng, lat]
    const name = props.location.name;
    const address = props.location.address ?? '';

    process.stdout.write(`[${i + 1}/${eligible.length}] ${name}...`);

    const cuisine = await getCuisine(name, address);
    console.log(` ${cuisine}`);

    const entry = {
      id: makeUniqueId(name, usedIds),
      name,
      tier: ratingToTier(props.five_star_rating_published),
      cuisine,
      lat,
      lng,
      googleMapsUrl: props.google_maps_url,
      dateAdded: props.date.split('T')[0],
    };

    // Include review text as notes if present
    if (props.review_text_published?.trim()) {
      entry.notes = props.review_text_published.trim();
    }

    restaurants.push(entry);

    // 150ms delay between requests to stay well under rate limits
    if (i < eligible.length - 1) {
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

  console.log(`\n✓ Wrote ${restaurants.length} restaurants to public/restaurants.json`);
  console.log('\nTier breakdown:');
  console.log(`  loved:        ${byTier.loved}`);
  console.log(`  recommended:  ${byTier.recommended}`);
  console.log(`  on_my_radar:  ${byTier.on_my_radar}`);
  console.log('\nCuisine breakdown:');
  Object.entries(byCuisine)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c.padEnd(20)} ${n}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
