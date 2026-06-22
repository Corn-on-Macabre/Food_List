#!/usr/bin/env node
// Fixes lat/lng for all "web research" restaurants by looking up actual
// coordinates via Google Places Text Search API.
// Usage: node scripts/fix-coords-new-cities.mjs [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const DRY_RUN = process.argv.includes('--dry-run');

const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) { console.error('No VITE_GOOGLE_MAPS_API_KEY in .env'); process.exit(1); }

const DELAY_MS = 200;
const restaurants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const toFix = restaurants.filter(r => r.source === 'web research');

console.log(`Found ${toFix.length} web-research restaurants to fix coordinates for.`);

async function lookupCoords(name, lat, lng) {
  const center = { latitude: lat, longitude: lng };
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.location,places.formattedAddress,places.googleMapsUri',
    },
    body: JSON.stringify({
      textQuery: name,
      maxResultCount: 1,
      locationBias: { circle: { center, radius: 50000 } },
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  const data = await resp.json();
  const place = data.places?.[0];
  if (!place?.location) return null;
  return {
    lat: place.location.latitude,
    lng: place.location.longitude,
    googleMapsUrl: place.googleMapsUri || null,
  };
}

let fixed = 0;
let errored = 0;
const updates = []; // for Supabase batch

for (let i = 0; i < toFix.length; i++) {
  const r = toFix[i];
  const idx = `[${i + 1}/${toFix.length}]`;
  process.stdout.write(`${idx} Looking up "${r.name}"...`);

  try {
    const result = await lookupCoords(r.name, r.lat, r.lng);
    if (!result) {
      console.log(' (not found)');
      errored++;
      continue;
    }

    const latDiff = Math.abs(r.lat - result.lat);
    const lngDiff = Math.abs(r.lng - result.lng);
    const moved = latDiff > 0.001 || lngDiff > 0.001;

    if (moved) {
      console.log(` MOVED (${r.lat},${r.lng}) -> (${result.lat},${result.lng})`);
      if (!DRY_RUN) {
        r.lat = result.lat;
        r.lng = result.lng;
        if (result.googleMapsUrl) r.googleMapsUrl = result.googleMapsUrl;
        updates.push({ id: r.id, lat: result.lat, lng: result.lng, googleMapsUrl: result.googleMapsUrl || r.googleMapsUrl });
      }
      fixed++;
    } else {
      console.log(' OK (already correct)');
    }
  } catch (err) {
    console.log(` ERROR: ${err.message}`);
    errored++;
  }

  if (i < toFix.length - 1) await new Promise(res => setTimeout(res, DELAY_MS));
}

if (!DRY_RUN && fixed > 0) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(restaurants, null, 2));
  console.log(`\nWrote updated restaurants.json (${fixed} coordinates fixed)`);

  // Update Supabase
  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    let sbFixed = 0;
    for (const u of updates) {
      const { error } = await supabase.from('restaurants').update({ lat: u.lat, lng: u.lng, googleMapsUrl: u.googleMapsUrl }).eq('id', u.id);
      if (!error) sbFixed++;
      else console.error(`  Supabase error for ${u.id}: ${error.message}`);
    }
    console.log(`Updated ${sbFixed}/${updates.length} in Supabase.`);
  }
} else if (DRY_RUN) {
  console.log(`\n[DRY RUN] Would fix ${fixed} coordinates.`);
}

console.log(`\n-- Summary --`);
console.log(`  Total:   ${toFix.length}`);
console.log(`  Fixed:   ${fixed}`);
console.log(`  Errored: ${errored}`);
