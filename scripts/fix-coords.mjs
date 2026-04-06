#!/usr/bin/env node
// Re-validates every restaurant's coordinates against the Places API (New),
// using name + "Phoenix AZ" and a Phoenix-metro location bias.
// Updates coords that are more than THRESHOLD_M meters from the stored value.
//
// Usage: node scripts/fix-coords.mjs [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const API_KEY = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) { console.error('No VITE_GOOGLE_MAPS_API_KEY in .env'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');
const THRESHOLD_M = 500; // flag if stored coords differ > 500m from API result
const PHX_CENTER = { latitude: 33.4484, longitude: -112.0740 };
const PHX_RADIUS_M = 50000; // 50km max allowed by Places API, covers PHX metro

const OUTPUT = path.join(ROOT, 'public/restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function lookupPhx(name) {
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.location,places.displayName',
      },
      body: JSON.stringify({
        textQuery: `${name} Phoenix AZ`,
        maxResultCount: 1,
        locationBias: {
          circle: { center: PHX_CENTER, radius: PHX_RADIUS_M },
        },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place?.location) return null;
    return { lat: place.location.latitude, lng: place.location.longitude };
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Auditing ${restaurants.length} restaurants (threshold: ${THRESHOLD_M}m)${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  const updated = [];
  const failed = [];

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    process.stdout.write(`[${i + 1}/${restaurants.length}] ${r.name}...`);

    const result = await lookupPhx(r.name);
    if (!result) {
      console.log(' (no result)');
      failed.push(r.name);
      await new Promise((res) => setTimeout(res, 150));
      continue;
    }

    const dist = haversineM(r.lat, r.lng, result.lat, result.lng);
    if (dist > THRESHOLD_M) {
      console.log(` ⚠  ${Math.round(dist)}m off → updating (${r.lat.toFixed(5)},${r.lng.toFixed(5)}) → (${result.lat.toFixed(5)},${result.lng.toFixed(5)})`);
      updated.push({ name: r.name, oldLat: r.lat, oldLng: r.lng, newLat: result.lat, newLng: result.lng, dist: Math.round(dist) });
      if (!DRY_RUN) {
        r.lat = result.lat;
        r.lng = result.lng;
      }
    } else {
      console.log(` ✓ (${Math.round(dist)}m)`);
    }

    await new Promise((res) => setTimeout(res, 150));
  }

  if (!DRY_RUN && updated.length > 0) {
    fs.writeFileSync(OUTPUT, JSON.stringify(restaurants, null, 2));
    console.log(`\n✓ Wrote updated restaurants.json`);
  }

  console.log(`\n── Summary ──`);
  console.log(`  Updated: ${updated.length}`);
  console.log(`  No API result: ${failed.length}`);
  if (updated.length > 0) {
    console.log('\nUpdated entries:');
    for (const u of updated) {
      console.log(`  ${u.name.padEnd(40)} ${u.dist}m off`);
    }
  }
  if (failed.length > 0) {
    console.log('\nNo result for:');
    for (const name of failed) console.log(`  ${name}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
