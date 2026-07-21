/**
 * One-time backfill: parse the prose visit lines ("[visited YYYY-MM-DD] text")
 * out of every restaurant's notes into structured rows in the visits store,
 * plus a bare row for any lastVisited date not covered by a prose line.
 * No spend/party data exists historically — those columns stay null.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/backfill-visits.js [--dry-run]
 *
 * Idempotent: existing visit rows are fetched first and matched on
 * restaurant_id|visited_on|note, so re-running never duplicates. Safe to
 * re-run any time (e.g. to heal a failed dual-write from log_visit).
 */
import { getAll, getVisits, insertVisit } from '../data.js';

const DRY_RUN = process.argv.includes('--dry-run');

// Same format the frontend parses in src/utils/visitNotes.ts
const VISIT_LINE = /^\[visited (\d{4}-\d{2}-\d{2})\]\s*(.*)$/;

const restaurants = await getAll();
if (restaurants.length === 0) {
  console.error('No data — check SUPABASE_URL/SUPABASE_SERVICE_KEY or DATA_FILE');
  process.exit(1);
}

const existing = await getVisits();
const seen = new Set(existing.map((v) => `${v.restaurant_id}|${v.visited_on}|${v.note ?? ''}`));
console.log(`${restaurants.length} restaurants, ${existing.length} visit rows already present`);

const candidates = [];
for (const r of restaurants) {
  const dates = new Set();
  for (const line of (r.notes ?? '').split('\n')) {
    const m = line.trim().match(VISIT_LINE);
    if (!m) continue;
    dates.add(m[1]);
    candidates.push({
      restaurant_id: r.id,
      restaurant_name: r.name,
      visited_on: m[1],
      note: m[2] || null,
      dishes: null,
      spend_cents: null,
      party_size: null,
    });
  }
  // lastVisited with no matching prose line still marks a real visit
  if (r.lastVisited && !dates.has(r.lastVisited)) {
    candidates.push({
      restaurant_id: r.id,
      restaurant_name: r.name,
      visited_on: r.lastVisited,
      note: null,
      dishes: null,
      spend_cents: null,
      party_size: null,
    });
  }
}

const fresh = candidates.filter((c) => !seen.has(`${c.restaurant_id}|${c.visited_on}|${c.note ?? ''}`));
console.log(`${candidates.length} candidate visits parsed, ${fresh.length} new`);

if (DRY_RUN) {
  for (const c of fresh) {
    console.log(`  ${c.visited_on}  ${c.restaurant_id}${c.note ? `  — ${c.note.slice(0, 60)}` : ''}`);
  }
  console.log(`Dry run: would insert ${fresh.length} rows`);
  process.exit(0);
}

let inserted = 0;
for (const c of fresh) {
  await insertVisit(c);
  inserted++;
  if (inserted % 25 === 0) console.log(`  ${inserted}/${fresh.length}…`);
}
console.log(`Inserted ${inserted} visit rows (${existing.length + inserted} total)`);
