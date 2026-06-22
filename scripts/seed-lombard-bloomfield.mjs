#!/usr/bin/env node
// Seeds ~40 restaurants near Lombard, IL and Bloomfield, CT into restaurants.json + Supabase
// Usage: node scripts/seed-lombard-bloomfield.mjs [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const DRY_RUN = process.argv.includes('--dry-run');

const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();

const today = new Date().toISOString().slice(0, 10);

// ============================================================
// LOMBARD / CHICAGO WESTERN SUBURBS (~20 restaurants)
// ============================================================
const lombardRestaurants = [
  // BBQ
  {
    id: "uncle-bubs-bbq-westmont",
    name: "Uncle Bub's BBQ",
    cuisine: "BBQ",
    lat: 41.7959, lng: -87.9756,
    googleMapsUrl: "https://www.google.com/maps/place/Uncle+Bub's+BBQ/",
    notes: "Westmont. Award-winning BBQ pit. Ribs and pulled pork are the standouts.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "q-bbq-la-grange",
    name: "Q-BBQ",
    cuisine: "BBQ",
    lat: 41.8050, lng: -87.8690,
    googleMapsUrl: "https://www.google.com/maps/place/Q-BBQ/",
    notes: "La Grange. Brisket, pulled pork, and smoked wings. Solid sides.",
    tags: ["quick lunch"]
  },
  // Italian
  {
    id: "gia-mia-lombard",
    name: "Gia Mia",
    cuisine: "Italian",
    lat: 41.8800, lng: -88.0078,
    googleMapsUrl: "https://www.google.com/maps/place/Gia+Mia/",
    notes: "Lombard. Neapolitan-style pizza and handmade pasta. Cozy spot.",
    tags: ["date night", "team dinner"]
  },
  {
    id: "antico-posto-oak-brook",
    name: "Antico Posto",
    cuisine: "Italian",
    lat: 41.8497, lng: -87.9503,
    googleMapsUrl: "https://www.google.com/maps/place/Antico+Posto/",
    notes: "Oak Brook. Lettuce Entertain You's Italian trattoria. Wood-fired pizzas and pastas.",
    tags: ["team dinner"]
  },
  {
    id: "labriola-oak-brook",
    name: "Labriola Ristorante",
    cuisine: "Italian",
    lat: 41.8510, lng: -87.9530,
    googleMapsUrl: "https://www.google.com/maps/place/Labriola+Ristorante/",
    notes: "Oak Brook Center. Chicago-style Italian with a bakery. Great bread program.",
    tags: ["team dinner"]
  },
  // Steakhouse
  {
    id: "harry-carays-lombard",
    name: "Harry Caray's Italian Steakhouse",
    cuisine: "Steakhouse",
    lat: 41.8740, lng: -88.0140,
    googleMapsUrl: "https://www.google.com/maps/place/Harry+Caray's+Italian+Steakhouse/",
    notes: "Lombard. Prime aged steaks and classic Italian in a sports-themed setting.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "wildfire-oak-brook",
    name: "Wildfire",
    cuisine: "American",
    lat: 41.8490, lng: -87.9520,
    googleMapsUrl: "https://www.google.com/maps/place/Wildfire/",
    notes: "Oak Brook. Wood-fired steaks, chops, and seafood. Upscale but not stuffy.",
    tags: ["team dinner"]
  },
  {
    id: "perrys-steakhouse-oak-brook",
    name: "Perry's Steakhouse & Grille",
    cuisine: "Steakhouse",
    lat: 41.8485, lng: -87.9510,
    googleMapsUrl: "https://www.google.com/maps/place/Perry's+Steakhouse+%26+Grille/",
    notes: "Oak Brook. Famous pork chop Fridays. Texas-based chain with polished service.",
    tags: ["team dinner"]
  },
  // Asian
  {
    id: "kitakata-ramen-lombard",
    name: "Kitakata Ramen Ban Nai",
    cuisine: "Japanese",
    lat: 41.8760, lng: -88.0080,
    googleMapsUrl: "https://www.google.com/maps/place/Kitakata+Ramen+Ban+Nai/",
    notes: "Lombard. Authentic Japanese ramen with house-made noodles. Feels like Tokyo.",
    tags: ["quick lunch", "must-try"]
  },
  {
    id: "kizuna-sushi-glen-ellyn",
    name: "Kizuna Sushi Bistro",
    cuisine: "Japanese",
    lat: 41.8770, lng: -88.0670,
    googleMapsUrl: "https://www.google.com/maps/place/Kizuna+Sushi+Bistro/",
    notes: "Glen Ellyn. Neighborhood sushi spot since 2018. Fresh fish, creative rolls.",
    tags: ["date night"]
  },
  {
    id: "roka-akor-oak-brook",
    name: "Roka Akor",
    cuisine: "Japanese",
    lat: 41.8500, lng: -87.9540,
    googleMapsUrl: "https://www.google.com/maps/place/Roka+Akor/",
    notes: "Oak Brook. Upscale Japanese robata and sushi. Premium wagyu and sake selection.",
    tags: ["date night"]
  },
  {
    id: "thai-kitchen-lombard",
    name: "Thai Kitchen",
    cuisine: "Thai",
    lat: 41.8790, lng: -88.0100,
    googleMapsUrl: "https://www.google.com/maps/place/Thai+Kitchen+Lombard/",
    notes: "Lombard. Reliable Thai classics — pad thai, curries, and Thai iced tea.",
    tags: ["quick lunch"]
  },
  // Mexican
  {
    id: "ancho-agave-lombard",
    name: "Ancho & Agave",
    cuisine: "Mexican",
    lat: 41.8780, lng: -88.0050,
    googleMapsUrl: "https://www.google.com/maps/place/Ancho+%26+Agave/",
    notes: "Lombard. Modern Mexican with a great tequila and mezcal bar.",
    tags: ["team dinner", "date night"]
  },
  {
    id: "taqueria-los-sombreros-lombard",
    name: "Taqueria Los Sombreros",
    cuisine: "Mexican",
    lat: 41.8720, lng: -88.0060,
    googleMapsUrl: "https://www.google.com/maps/place/Taqueria+Los+Sombreros/",
    notes: "Lombard. Authentic street tacos, burritos, and tortas at great prices.",
    tags: ["quick lunch"]
  },
  // Burgers & American
  {
    id: "weber-grill-lombard",
    name: "Weber Grill Restaurant",
    cuisine: "American",
    lat: 41.8730, lng: -88.0090,
    googleMapsUrl: "https://www.google.com/maps/place/Weber+Grill+Restaurant/",
    notes: "Lombard. Everything cooked on Weber charcoal kettles. Steaks, ribs, burgers.",
    tags: ["team dinner"]
  },
  // Pizza
  {
    id: "giordanos-lombard",
    name: "Giordano's",
    cuisine: "Pizza",
    lat: 41.8810, lng: -88.0120,
    googleMapsUrl: "https://www.google.com/maps/place/Giordano's/",
    notes: "Lombard. Chicago deep dish stuffed pizza. Tourist or not, it's the real deal.",
    tags: ["team dinner", "must-try"]
  },
  // Chicken
  {
    id: "fry-the-coop-elmhurst",
    name: "Fry the Coop",
    cuisine: "Southern",
    lat: 41.8994, lng: -87.9403,
    googleMapsUrl: "https://www.google.com/maps/place/Fry+the+Coop/",
    notes: "Elmhurst. Nashville hot chicken with heat levels from 'no spice' to 'reaper.'",
    tags: ["quick lunch"]
  },
  {
    id: "rude-rooster-lombard",
    name: "Rude Rooster",
    cuisine: "American",
    lat: 41.8770, lng: -88.0050,
    googleMapsUrl: "https://www.google.com/maps/place/Rude+Rooster/",
    notes: "Lombard. Fried chicken sandwiches and tenders. Casual counter-service.",
    tags: ["quick lunch"]
  },
];

// ============================================================
// BLOOMFIELD / WEST HARTFORD / HARTFORD CT (~20 restaurants)
// ============================================================
const bloomfieldRestaurants = [
  // American / Gastropub
  {
    id: "republic-bloomfield-ct",
    name: "Republic",
    cuisine: "American",
    lat: 41.8260, lng: -72.7380,
    googleMapsUrl: "https://www.google.com/maps/place/Republic+Bloomfield/",
    notes: "Bloomfield gastropub. Inventive American — bacon-wrapped dates, miso-maple salmon, craft beer.",
    tags: ["team dinner"]
  },
  {
    id: "taste-778-bloomfield-ct",
    name: "Taste 778",
    cuisine: "American",
    lat: 41.8240, lng: -72.7350,
    googleMapsUrl: "https://www.google.com/maps/place/Taste+778/",
    notes: "Bloomfield. Cozy spot for a laid-back dinner or quick bite.",
    tags: ["quick lunch"]
  },
  // Indian
  {
    id: "naatiya-bloomfield-ct",
    name: "Naatiya Restaurant",
    cuisine: "Indian",
    lat: 41.8250, lng: -72.7370,
    googleMapsUrl: "https://www.google.com/maps/place/Naatiya+Restaurant/",
    notes: "Bloomfield. South Indian — masala dosas and chutneys are the highlights.",
    tags: ["quick lunch"]
  },
  // Italian
  {
    id: "pasticceria-italia-bloomfield-ct",
    name: "Pasticceria Italia",
    cuisine: "Italian",
    lat: 41.8230, lng: -72.7340,
    googleMapsUrl: "https://www.google.com/maps/place/Pasticceria+Italia/",
    notes: "Bloomfield. Authentic Italian bakery. Creamy cannoli and flaky pastries.",
    tags: ["quick lunch"]
  },
  // Steakhouse / Seafood
  {
    id: "flemings-west-hartford-ct",
    name: "Fleming's Prime Steakhouse",
    cuisine: "Steakhouse",
    lat: 41.7620, lng: -72.7420,
    googleMapsUrl: "https://www.google.com/maps/place/Fleming's+Prime+Steakhouse/",
    notes: "West Hartford. Prime steaks, exceptional wine list, handcrafted cocktails.",
    tags: ["team dinner"]
  },
  {
    id: "maxs-oyster-bar-west-hartford-ct",
    name: "Max's Oyster Bar",
    cuisine: "Seafood",
    lat: 41.7660, lng: -72.7410,
    googleMapsUrl: "https://www.google.com/maps/place/Max's+Oyster+Bar/",
    notes: "West Hartford. Bi-coastal oysters, extensive raw bar. Multiple Reader's Choice awards.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "j-gilberts-glastonbury-ct",
    name: "J. Gilbert's Wood-Fired Steaks",
    cuisine: "Steakhouse",
    lat: 41.7140, lng: -72.6080,
    googleMapsUrl: "https://www.google.com/maps/place/J.+Gilbert's/",
    notes: "Glastonbury. Wood-fired Prime steaks and award-winning crab cakes. OpenTable Diners Choice.",
    tags: ["team dinner"]
  },
  {
    id: "feng-chophouse-hartford-ct",
    name: "Feng Chophouse",
    cuisine: "Steakhouse",
    lat: 41.7670, lng: -72.6730,
    googleMapsUrl: "https://www.google.com/maps/place/Feng+Chophouse/",
    notes: "Downtown Hartford. Fine dining with modern casual vibe. Asian-influenced steaks.",
    tags: ["date night"]
  },
  // Chinese
  {
    id: "sichuan-alley-west-hartford-ct",
    name: "Sichuan Alley Bistro",
    cuisine: "Chinese",
    lat: 41.7680, lng: -72.7150,
    googleMapsUrl: "https://www.google.com/maps/place/Sichuan+Alley+Bistro/",
    notes: "West Hartford. Authentic Sichuan — chili chicken, mapo tofu, pork dumplings.",
    tags: ["quick lunch", "must-try"]
  },
  // Middle Eastern
  {
    id: "tangiers-west-hartford-ct",
    name: "Tangiers",
    cuisine: "Middle Eastern",
    lat: 41.7700, lng: -72.7200,
    googleMapsUrl: "https://www.google.com/maps/place/Tangiers/",
    notes: "Hartford/West Hartford line. Market and grill. Kebabs and chicken curry over rice pilaf.",
    tags: ["quick lunch"]
  },
  // Cafe / Brunch
  {
    id: "pond-house-cafe-hartford-ct",
    name: "Pond House Cafe",
    cuisine: "American",
    lat: 41.7750, lng: -72.7130,
    googleMapsUrl: "https://www.google.com/maps/place/Pond+House+Cafe/",
    notes: "Hartford. On the pond in Elizabeth Park. Eclectic comfort food, seasonal menu.",
    tags: ["date night", "patio"]
  },
  {
    id: "story-and-soil-hartford-ct",
    name: "Story and Soil",
    cuisine: "Cafe",
    lat: 41.7640, lng: -72.6800,
    googleMapsUrl: "https://www.google.com/maps/place/Story+and+Soil/",
    notes: "Hartford. Global 'Top 100' coffee shop. Great cortados and smoked salmon toast.",
    tags: ["quick lunch"]
  },
  {
    id: "spicy-green-bean-hartford-ct",
    name: "The Spicy Green Bean",
    cuisine: "American",
    lat: 41.7630, lng: -72.6850,
    googleMapsUrl: "https://www.google.com/maps/place/The+Spicy+Green+Bean/",
    notes: "Hartford. Breakfast that expanded to dinner. Korean steak sandwich is a sleeper hit.",
    tags: ["quick lunch"]
  },
  // Burgers
  {
    id: "max-burger-west-hartford-ct",
    name: "Max Burger",
    cuisine: "American",
    lat: 41.7650, lng: -72.7430,
    googleMapsUrl: "https://www.google.com/maps/place/Max+Burger/",
    notes: "West Hartford. Korean BBQ burger and complimentary seasoned fries.",
    tags: ["quick lunch"]
  },
  {
    id: "tavern-in-the-square-west-hartford-ct",
    name: "Tavern in The Square",
    cuisine: "American",
    lat: 41.7640, lng: -72.7400,
    googleMapsUrl: "https://www.google.com/maps/place/Tavern+in+The+Square/",
    notes: "West Hartford. New England pub. Picante burgers, Nashville hot chicken sandwiches.",
    tags: ["team dinner"]
  },
  // Pizza
  {
    id: "joeys-pizza-pie-west-hartford-ct",
    name: "Joey's Pizza Pie",
    cuisine: "Pizza",
    lat: 41.7620, lng: -72.7380,
    googleMapsUrl: "https://www.google.com/maps/place/Joey's+Pizza+Pie/",
    notes: "West Hartford. Indie pizza — pepperoni, buffalo chicken calzone, cheesesteak grinders.",
    tags: ["quick lunch"]
  },
  // Indian
  {
    id: "dhaba-wala-hartford-ct",
    name: "Dhaba Wala Indian Kitchen",
    cuisine: "Indian",
    lat: 41.7660, lng: -72.6810,
    googleMapsUrl: "https://www.google.com/maps/place/Dhaba+Wala+Indian+Kitchen/",
    notes: "Hartford. Dhaba-style Indian street food. Flavorful and affordable.",
    tags: ["quick lunch"]
  },
];

const allNew = [...lombardRestaurants, ...bloomfieldRestaurants].map(r => ({
  ...r,
  tier: "on_my_radar",
  dateAdded: today,
  source: "web research",
}));

// Read existing, filter dupes
const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const existingIds = new Set(existing.map(r => r.id));
const toInsert = allNew.filter(r => !existingIds.has(r.id));
const skipped = allNew.length - toInsert.length;

console.log(`Lombard/Chicago: ${lombardRestaurants.length} restaurants`);
console.log(`Bloomfield/Hartford: ${bloomfieldRestaurants.length} restaurants`);
console.log(`Total new: ${toInsert.length} (${skipped} already exist)`);

if (DRY_RUN) {
  toInsert.forEach(r => console.log(`  + ${r.id}: ${r.name} (${r.cuisine})`));
  console.log('[DRY RUN] No changes made.');
  process.exit(0);
}

// Write to restaurants.json
existing.push(...toInsert);
fs.writeFileSync(JSON_PATH, JSON.stringify(existing, null, 2));
console.log(`\nWrote ${toInsert.length} restaurants to restaurants.json (total: ${existing.length})`);

// Insert into Supabase
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_URL && SERVICE_ROLE_KEY) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('restaurants').insert(toInsert).select('id');
  if (error) {
    console.error('Supabase insert failed:', error.message);
    process.exit(1);
  }
  console.log(`Inserted ${data.length} restaurants into Supabase.`);
} else {
  console.log('\nNo SUPABASE_SERVICE_ROLE_KEY — skipped Supabase insert.');
  console.log('Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-lombard-bloomfield.mjs');
}

console.log(`\nRun 'node scripts/enrich-places.mjs' to populate ratings and photos.`);
