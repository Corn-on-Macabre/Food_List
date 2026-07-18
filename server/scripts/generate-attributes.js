/**
 * Extract structured attributes (dishes, occasion/vibe tags) from each
 * restaurant's existing notes via the Claude API, and produce a verification
 * report of records whose data looks untrustworthy.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... DATA_FILE=... node scripts/generate-attributes.js [--limit N] [--verify-only]
 *
 * - Extraction ONLY records what the note already states — dishes must be
 *   named in the note; tags must be clearly supported by it. No invention.
 * - Existing tags/dishes are merged, never removed.
 * - --verify-only skips the API entirely and just writes the report
 *   (business status + unenriched/suspect records).
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import { readData, writeData, TAG_VOCABULARY } from '../data.js';

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const VERIFY_ONLY = args.includes('--verify-only');
const CONCURRENCY = 4;
const REPORT = 'verification-report.md';

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    dishes: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific dishes/drinks the note names as good, recommended, or "the move". Empty if none named.',
    },
    tags: {
      type: 'array',
      items: { type: 'string', enum: [...TAG_VOCABULARY] },
      description: 'Occasion/vibe tags the note clearly supports. Empty if unclear.',
    },
    location_issue: {
      type: ['string', 'null'],
      description: 'One sentence if the note makes a location claim inconsistent with the given address/city, else null.',
    },
  },
  required: ['dishes', 'tags', 'location_issue'],
  additionalProperties: false,
};

function buildPrompt(r) {
  return [
    `Restaurant: ${r.name} (${r.cuisine}) — city region: ${r.city ?? 'unknown'}`,
    `Verified address: ${r.address ?? 'unknown'}`,
    `Curator note: """${r.notes}"""`,
    '',
    'Extract only what the note itself states:',
    '- dishes: specific dishes or drinks the note calls out as good/recommended. Do not invent or generalize.',
    '- tags: pick from the allowed vocabulary only when the note clearly supports them.',
    '- location_issue: if the note claims a location/neighborhood/city inconsistent with the verified address, describe it in one sentence; otherwise null.',
  ].join('\n');
}

async function extract(client, r) {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [{ role: 'user', content: buildPrompt(r) }],
  });
  if (response.stop_reason === 'refusal') return null;
  return JSON.parse(response.content.find((b) => b.type === 'text').text);
}

function writeReport(data, locationIssues) {
  const closed = data.filter((r) => r.businessStatus && r.businessStatus !== 'OPERATIONAL');
  const unenriched = data.filter((r) => !r.googlePlaceId);
  const lines = [
    `# Verification report — ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Known fixes (from curator review — memory: Restaurant Data Fixes)',
    '- **Mr. Pickles** — pin location is wrong; move to the correct spot.',
    '- **Manna BBQ** — note references the West Gate location; confirm the note matches the pinned location.',
    '',
    `## Possibly closed (${closed.length}) — businessStatus from Google Places`,
    ...closed.map((r) => `- **${r.name}** (\`${r.id}\`) — ${r.businessStatus}`),
    '',
    `## Unenriched / suspect matches (${unenriched.length}) — no Places match near the pin; name, pin, or city is likely wrong (see server/backfill-report.md)`,
    ...unenriched.map((r) => `- **${r.name}** (\`${r.id}\`) — city=${r.city}, pin=${r.lat},${r.lng}`),
    '',
    `## Note/location inconsistencies (${locationIssues.length}) — note text vs verified address`,
    ...locationIssues.map(({ r, issue }) => `- **${r.name}** (\`${r.id}\`) — ${issue}`),
    '',
  ];
  fs.writeFileSync(REPORT, lines.join('\n'));
}

const data = readData();
const locationIssues = [];

if (VERIFY_ONLY) {
  writeReport(data, locationIssues);
  console.log(`Verification-only report written to ${REPORT}`);
  process.exit(0);
}

const client = new Anthropic();
const pending = data.filter((r) => r.notes).slice(0, LIMIT);
console.log(`${pending.length} records with notes to process`);

let done = 0;
async function worker(queue) {
  for (;;) {
    const r = queue.shift();
    if (!r) return;
    try {
      const out = await extract(client, r);
      if (out) {
        if (out.dishes.length) r.dishes = [...new Set([...(r.dishes ?? []), ...out.dishes])];
        const validTags = out.tags.filter((t) => TAG_VOCABULARY.includes(t));
        if (validTags.length) r.tags = [...new Set([...(r.tags ?? []), ...validTags])];
        if (out.location_issue) locationIssues.push({ r, issue: out.location_issue });
      }
    } catch (err) {
      console.error(`FAILED ${r.id}: ${err.message}`);
    }
    done++;
    if (done % 25 === 0) {
      writeData(data);
      console.log(`${done}/${pending.length}`);
    }
  }
}

const queue = [...pending];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
writeData(data);
writeReport(data, locationIssues);
console.log(`Done: ${done} processed, ${locationIssues.length} location issues → ${REPORT}`);
