#!/usr/bin/env node

/**
 * Migrates restaurant data from public/restaurants.json into the Supabase restaurants table.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-to-supabase.js
 *
 * Uses the service role key (not the anon key) to bypass RLS for bulk insert.
 * Idempotent: uses upsert on id, safe to re-run.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const jsonPath = resolve(__dirname, '../public/restaurants.json');
const rawData = readFileSync(jsonPath, 'utf-8');
const restaurants = JSON.parse(rawData);

if (!Array.isArray(restaurants)) {
  console.error('restaurants.json does not contain an array');
  process.exit(1);
}

console.log(`Migrating ${restaurants.length} restaurants to Supabase...`);

// Upsert in batches of 100
const BATCH_SIZE = 100;
let migrated = 0;

for (let i = 0; i < restaurants.length; i += BATCH_SIZE) {
  const batch = restaurants.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('restaurants')
    .upsert(batch, { onConflict: 'id' });

  if (error) {
    console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
    process.exit(1);
  }

  migrated += batch.length;
  console.log(`  ${migrated}/${restaurants.length} records upserted`);
}

console.log(`Done. ${migrated} restaurants migrated to Supabase.`);
