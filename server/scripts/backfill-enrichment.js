/**
 * One-time backfill: enrich every restaurant with Google Places data
 * (place ID, address, opening hours, website, phone, business status,
 * plus refreshed rating/price/photo).
 *
 * Usage:
 *   GOOGLE_API_KEY=... DATA_FILE=path/to/restaurants.json node scripts/backfill-enrichment.js [--limit N] [--force]
 *
 * - Skips records that already have googlePlaceId (resume-safe) unless --force.
 * - Writes the data file incrementally every 20 records.
 * - A match whose location is > 3 miles from the record's pin is NOT applied;
 *   it's logged to backfill-report.md for manual review (wrong pin or wrong match).
 */
import { getAll, updateRow, enrichRestaurant, haversineDistance } from '../data.js';
import fs from 'node:fs';

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const FORCE = args.includes('--force');
const BACKFILL_RADIUS_M = 2000; // tight bias — we already know roughly where it is
const MAX_MATCH_MILES = 3;
const THROTTLE_MS = 500;
const REPORT = 'backfill-report.md';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const data = await getAll();
if (data.length === 0) {
  console.error('No data — check DATA_FILE');
  process.exit(1);
}

const pending = data.filter((r) => FORCE || !r.googlePlaceId).slice(0, LIMIT);
console.log(`${data.length} records total, ${pending.length} to enrich (limit=${LIMIT === Infinity ? 'none' : LIMIT}, force=${FORCE})`);

const suspects = [];
const misses = [];
let applied = 0;

for (const [i, r] of pending.entries()) {
  const result = await enrichRestaurant(r.name, r.lat, r.lng, BACKFILL_RADIUS_M);

  if (!result) {
    misses.push(r);
    console.log(`[${i + 1}/${pending.length}] MISS   ${r.name}`);
  } else {
    const loc = result.matchLocation;
    const dist = loc ? haversineDistance(r.lat, r.lng, loc.latitude, loc.longitude) : null;
    if (dist !== null && dist > MAX_MATCH_MILES) {
      suspects.push({ r, dist, address: result.fields.address });
      console.log(`[${i + 1}/${pending.length}] SUSPECT ${r.name} — match ${dist.toFixed(1)} mi from pin, skipped`);
    } else {
      await updateRow(r.id, result.fields);
      Object.assign(r, result.fields);
      applied++;
      console.log(`[${i + 1}/${pending.length}] ok     ${r.name}${dist !== null ? ` (${dist.toFixed(2)} mi)` : ''}`);
    }
  }

  await sleep(THROTTLE_MS);
}

const lines = [
  `# Backfill report — ${new Date().toISOString().slice(0, 10)}`,
  '',
  `Applied: ${applied} / ${pending.length} attempted`,
  '',
  `## Suspect matches (place > ${MAX_MATCH_MILES} mi from pin — NOT applied; wrong pin or wrong match)`,
  ...suspects.map(({ r, dist, address }) => `- **${r.name}** (\`${r.id}\`) — matched "${address}" ${dist.toFixed(1)} mi away. Pin: ${r.lat},${r.lng}`),
  '',
  '## No match found',
  ...misses.map((r) => `- **${r.name}** (\`${r.id}\`) — ${r.lat},${r.lng}`),
  '',
];
fs.writeFileSync(REPORT, lines.join('\n'));
console.log(`\nDone. applied=${applied} suspects=${suspects.length} misses=${misses.length} → ${REPORT}`);
