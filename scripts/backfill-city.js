#!/usr/bin/env node

/**
 * Backfill city field on all restaurants in public/restaurants.json.
 * Assigns each restaurant to the nearest metro region within its radius.
 *
 * Usage: node scripts/backfill-city.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const METRO_REGIONS = [
  { id: 'phoenix', label: 'Phoenix', center: { lat: 33.4484, lng: -112.0740 }, radius: 60 },
  { id: 'dallas', label: 'Dallas', center: { lat: 32.7767, lng: -96.7970 }, radius: 50 },
  { id: 'chicago', label: 'Chicago', center: { lat: 41.8781, lng: -87.6298 }, radius: 40 },
  { id: 'se-connecticut', label: 'SE Connecticut', center: { lat: 41.3556, lng: -72.0995 }, radius: 30 },
  { id: 'wichita', label: 'Wichita', center: { lat: 37.6872, lng: -97.3301 }, radius: 30 },
  { id: 'hartford', label: 'Hartford', center: { lat: 41.7658, lng: -72.6734 }, radius: 25 },
  { id: 'nyc', label: 'New York City', center: { lat: 40.7128, lng: -74.0060 }, radius: 30 },
  { id: 'paris', label: 'Paris', center: { lat: 48.8566, lng: 2.3522 }, radius: 20 },
];

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestMetro(lat, lng) {
  let best = null;
  let bestDist = Infinity;

  for (const metro of METRO_REGIONS) {
    const dist = haversineDistance(lat, lng, metro.center.lat, metro.center.lng);
    if (dist <= metro.radius && dist < bestDist) {
      best = metro;
      bestDist = dist;
    }
  }

  return best ? { metro: best, distance: bestDist } : null;
}

const jsonPath = resolve(__dirname, '..', 'public', 'restaurants.json');
const raw = readFileSync(jsonPath, 'utf-8');
const restaurants = JSON.parse(raw);

const unmatched = [];
const cityCounts = {};
let alreadyHadCity = 0;
let assigned = 0;

for (const r of restaurants) {
  if (r.city) {
    alreadyHadCity++;
    cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
    continue;
  }

  const match = findNearestMetro(r.lat, r.lng);
  if (match) {
    r.city = match.metro.id;
    cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
    assigned++;
  } else {
    unmatched.push({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      nearestMetros: METRO_REGIONS.map((m) => ({
        id: m.id,
        distance: Math.round(haversineDistance(r.lat, r.lng, m.center.lat, m.center.lng)),
      }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3),
    });
  }
}

// Report
console.log('\n=== Backfill City Report ===\n');
console.log(`Total restaurants: ${restaurants.length}`);
console.log(`Already had city:  ${alreadyHadCity}`);
console.log(`Assigned:          ${assigned}`);
console.log(`Unmatched:         ${unmatched.length}`);
console.log('\nCity counts:');
for (const [city, count] of Object.entries(cityCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${city}: ${count}`);
}

if (unmatched.length > 0) {
  console.log('\n=== UNMATCHED RESTAURANTS (need manual assignment) ===\n');
  for (const u of unmatched) {
    console.log(`  ${u.name} (${u.id})`);
    console.log(`    lat: ${u.lat}, lng: ${u.lng}`);
    console.log(`    Nearest: ${u.nearestMetros.map((m) => `${m.id} (${m.distance} mi)`).join(', ')}`);
    console.log();
  }
}

// Write updated JSON
writeFileSync(jsonPath, JSON.stringify(restaurants, null, 2) + '\n');
console.log(`\nWrote updated restaurants.json`);

if (unmatched.length > 0) {
  console.log(`\n⚠ ${unmatched.length} restaurant(s) need manual city assignment!`);
  process.exit(1);
}
