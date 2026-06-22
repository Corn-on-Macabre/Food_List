#!/usr/bin/env node
// Inserts Dallas restaurants from restaurants.json into Supabase
// Usage: node scripts/seed-dallas-supabase.mjs [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// Read env
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const ADMIN_EMAIL = envContent.match(/VITE_ADMIN_EMAIL=(.+)/)?.[1]?.trim();
const ADMIN_PASSWORD = envContent.match(/VITE_ADMIN_PASSWORD=(.+)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Authenticate with provided credentials
const DB_USER = process.env.SB_USER || 'food_list';
const DB_PASS = process.env.SB_PASS || '';

if (DB_USER && DB_PASS) {
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: DB_USER,
    password: DB_PASS,
  });
  if (authErr) {
    console.error('Auth failed:', authErr.message);
    process.exit(1);
  }
  console.log(`Authenticated as ${DB_USER}`);
}

// Read all restaurants from JSON, filter to Dallas entries (lat 32-34, lng -97 to -96)
const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const allRestaurants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const dallasEntries = allRestaurants.filter(r =>
  r.lat > 32 && r.lat < 34 && r.lng > -97.5 && r.lng < -96
);

console.log(`Found ${dallasEntries.length} Dallas restaurants in restaurants.json`);

if (DRY_RUN) {
  dallasEntries.forEach(r => console.log(`  ${r.id}: ${r.name}`));
  console.log('[DRY RUN] No changes made.');
  process.exit(0);
}

// Check which already exist in Supabase
const { data: existing, error: fetchErr } = await supabase
  .from('restaurants')
  .select('id')
  .in('id', dallasEntries.map(r => r.id));

if (fetchErr) {
  console.error('Failed to check existing:', fetchErr.message);
  process.exit(1);
}

const existingIds = new Set((existing || []).map(r => r.id));
const toInsert = dallasEntries.filter(r => !existingIds.has(r.id));

if (toInsert.length === 0) {
  console.log('All Dallas restaurants already exist in Supabase.');
  process.exit(0);
}

console.log(`Inserting ${toInsert.length} new restaurants (${existingIds.size} already exist)...`);

const { data, error } = await supabase
  .from('restaurants')
  .insert(toInsert)
  .select();

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log(`Successfully inserted ${data.length} Dallas restaurants into Supabase.`);
