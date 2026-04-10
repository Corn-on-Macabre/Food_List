#!/usr/bin/env node
// Enriches restaurant records with Google Places data (rating, price level,
// photo reference, review count). Reads public/restaurants.json, calls the
// Places API (New) Text Search endpoint, and writes enrichment fields back.
//
// Usage: node scripts/enrich-places.mjs [--force] [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Read API key from .env (same pattern as fix-coords.mjs)
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) {
  console.error('No VITE_GOOGLE_MAPS_API_KEY in .env');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 200;
const PHX_CENTER = { latitude: 33.4484, longitude: -112.0740 };
const PHX_RADIUS_M = 50000;
const FIELD_MASK = 'places.rating,places.userRatingCount,places.priceLevel,places.photos';

const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

async function enrichRestaurant(name) {
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${name} Phoenix AZ`,
      maxResultCount: 1,
      locationBias: {
        circle: { center: PHX_CENTER, radius: PHX_RADIUS_M },
      },
    }),
  });

  if (!resp.ok) {
    throw new Error(`API ${resp.status}: ${resp.statusText}`);
  }

  const data = await resp.json();
  const place = data.places?.[0];
  if (!place) return null;

  const result = {};
  if (typeof place.rating === 'number') result.rating = place.rating;
  if (typeof place.userRatingCount === 'number') result.userRatingCount = place.userRatingCount;
  if (place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED') result.priceLevel = place.priceLevel;
  if (place.photos?.[0]?.name) result.photoRef = place.photos[0].name;

  return result;
}

async function main() {
  const total = restaurants.length;
  let enriched = 0;
  let skipped = 0;
  let errored = 0;

  console.log(`Processing ${total} restaurants${FORCE ? ' [FORCE]' : ''}${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  for (let i = 0; i < total; i++) {
    const r = restaurants[i];
    const idx = `[${i + 1}/${total}]`;

    if (!FORCE && r.enrichedAt) {
      console.log(`${idx} Skipping "${r.name}" (already enriched)`);
      skipped++;
      continue;
    }

    process.stdout.write(`${idx} Enriching "${r.name}"...`);

    try {
      const fields = await enrichRestaurant(r.name);

      if (!fields || Object.keys(fields).length === 0) {
        console.log(' (no data returned)');
        errored++;
      } else {
        const today = new Date().toISOString().slice(0, 10);

        if (!DRY_RUN) {
          // Only write enrichment fields; never touch curator fields
          if (fields.rating !== undefined) r.rating = fields.rating;
          if (fields.userRatingCount !== undefined) r.userRatingCount = fields.userRatingCount;
          if (fields.priceLevel !== undefined) r.priceLevel = fields.priceLevel;
          if (fields.photoRef !== undefined) r.photoRef = fields.photoRef;
          r.enrichedAt = today;
        }

        const fieldNames = Object.keys(fields).join(', ');
        console.log(` OK (${fieldNames})`);
        enriched++;
      }
    } catch (err) {
      console.log(' ERROR');
      console.error(`  [error] "${r.name}": ${err.message}`);
      errored++;
    }

    // Rate-limit delay between API calls
    if (i < total - 1) {
      await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }

  // Write results
  if (!DRY_RUN && enriched > 0) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(restaurants, null, 2));
    console.log(`\nWrote updated restaurants.json`);
  } else if (DRY_RUN) {
    console.log(`\n[DRY RUN] No file changes written.`);
  }

  // Summary
  console.log(`\n-- Summary --`);
  console.log(`  Total:    ${total}`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errored:  ${errored}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
