#!/usr/bin/env node
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

const wichitaRestaurants = [
  // BBQ (4)
  {
    id: "station-8-bbq-wichita",
    name: "Station 8 BBQ",
    cuisine: "BBQ",
    lat: 37.6872, lng: -97.3301,
    googleMapsUrl: "https://www.google.com/maps/place/Station+8+BBQ/",
    notes: "Locals say it beats Kansas City BBQ. That's a bold claim in Kansas, and they back it up.",
    tags: ["must-try", "quick lunch"]
  },
  {
    id: "hog-wild-pit-bbq-wichita",
    name: "Hog Wild Pit Bar-B-Q",
    cuisine: "BBQ",
    lat: 37.6940, lng: -97.3470,
    googleMapsUrl: "https://www.google.com/maps/place/Hog+Wild+Pit+Bar-B-Q/",
    notes: "Closes at 2pm because they sell out. Get there early.",
    tags: ["quick lunch"]
  },
  {
    id: "sweet-willys-bbq-wichita",
    name: "Sweet Willy's BBQ",
    cuisine: "BBQ",
    lat: 37.6850, lng: -97.2800,
    googleMapsUrl: "https://www.google.com/maps/place/Sweet+Willy's+BBQ/",
    notes: "More creative than most Wichita BBQ. Tasty and different.",
    tags: ["quick lunch"]
  },
  {
    id: "bite-me-bbq-wichita",
    name: "Bite Me BBQ",
    cuisine: "BBQ",
    lat: 37.6930, lng: -97.3380,
    googleMapsUrl: "https://www.google.com/maps/place/Bite+Me+BBQ/",
    notes: "Great name, great BBQ. Competition-style smoked meats.",
    tags: ["quick lunch"]
  },
  // Burgers (3)
  {
    id: "busters-burger-joint-wichita",
    name: "Buster's Burger Joint",
    cuisine: "American",
    lat: 37.6880, lng: -97.3360,
    googleMapsUrl: "https://www.google.com/maps/place/Buster's+Burger+Joint/",
    notes: "Local favorite for burgers. Fresh ground beef, creative toppings.",
    tags: ["quick lunch"]
  },
  {
    id: "dempseys-burger-pub-wichita",
    name: "Dempsey's Burger Pub",
    cuisine: "American",
    lat: 37.6860, lng: -97.3380,
    googleMapsUrl: "https://www.google.com/maps/place/Dempsey's+Burger+Pub/",
    notes: "Craft beer and smash burgers. Good pub vibe.",
    tags: ["quick lunch", "team dinner"]
  },
  {
    id: "public-wichita",
    name: "Public",
    cuisine: "American",
    lat: 37.6870, lng: -97.3370,
    googleMapsUrl: "https://www.google.com/maps/place/Public+Wichita/",
    notes: "One of Wichita's top-rated overall. New American with elevated comfort food.",
    tags: ["team dinner", "date night", "must-try"]
  },
  // Steakhouse (2)
  {
    id: "6s-steakhouse-wichita",
    name: "6S Steakhouse",
    cuisine: "Steakhouse",
    lat: 37.6850, lng: -97.3350,
    googleMapsUrl: "https://www.google.com/maps/place/6S+Steakhouse/",
    notes: "Fine dining with live music. Top-quality steaks in a classy setting.",
    tags: ["team dinner", "date night"]
  },
  {
    id: "siena-tuscan-steakhouse-wichita",
    name: "Siena Tuscan Steakhouse",
    cuisine: "Steakhouse",
    lat: 37.6920, lng: -97.3310,
    googleMapsUrl: "https://www.google.com/maps/place/Siena+Tuscan+Steakhouse/",
    notes: "Tuscan flavors meet American steakhouse. Great wine list.",
    tags: ["team dinner"]
  },
  // Mexican (3)
  {
    id: "puerto-vallarta-wichita",
    name: "Puerto Vallarta Mexican Restaurant",
    cuisine: "Mexican",
    lat: 37.6950, lng: -97.3500,
    googleMapsUrl: "https://www.google.com/maps/place/Puerto+Vallarta+Mexican+Restaurant/",
    notes: "Very flavorful authentic Mexican. Generous portions.",
    tags: ["quick lunch"]
  },
  {
    id: "sabor-latin-bar-wichita",
    name: "Sabor Latin Bar & Grill",
    cuisine: "Latin",
    lat: 37.6865, lng: -97.3340,
    googleMapsUrl: "https://www.google.com/maps/place/Sabor+Latin+Bar+%26+Grill/",
    notes: "Top-rated on Yelp. Latin fusion with great cocktails.",
    tags: ["team dinner", "date night"]
  },
  {
    id: "abuelos-wichita",
    name: "Abuelo's Mexican Restaurant",
    cuisine: "Mexican",
    lat: 37.6840, lng: -97.2510,
    googleMapsUrl: "https://www.google.com/maps/place/Abuelo's+Mexican+Restaurant/",
    notes: "Festive atmosphere. Made-from-scratch Mexican with good margaritas.",
    tags: ["team dinner"]
  },
  // Asian (3)
  {
    id: "little-vietnam-kitchen-wichita",
    name: "Little Vietnam Kitchen",
    cuisine: "Vietnamese",
    lat: 37.6800, lng: -97.3150,
    googleMapsUrl: "https://www.google.com/maps/place/Little+Vietnam+Kitchen/",
    notes: "Hidden gem. Goes beyond pho — dumplings, skillets, and baguette combos.",
    tags: ["quick lunch", "must-try"]
  },
  {
    id: "yokohama-ramen-wichita",
    name: "Yokohama Ramen Joint",
    cuisine: "Japanese",
    lat: 37.6870, lng: -97.3350,
    googleMapsUrl: "https://www.google.com/maps/place/Yokohama+Ramen+Joint/",
    notes: "Wichita's go-to for ramen and noodle dishes.",
    tags: ["quick lunch"]
  },
  {
    id: "lemongrass-taste-vietnam-wichita",
    name: "New Lemongrass Taste of Vietnam",
    cuisine: "Vietnamese",
    lat: 37.6920, lng: -97.3100,
    googleMapsUrl: "https://www.google.com/maps/place/New+Lemongrass+Taste+of+Vietnam/",
    notes: "Authentic Vietnamese flavors. Solid pho and vermicelli bowls.",
    tags: ["quick lunch"]
  },
  // Pizza (2)
  {
    id: "piatto-neapolitan-wichita",
    name: "Piatto Neapolitan Pizzeria",
    cuisine: "Pizza",
    lat: 37.6855, lng: -97.3345,
    googleMapsUrl: "https://www.google.com/maps/place/Piatto+Neapolitan+Pizzeria/",
    notes: "Authentic Neapolitan pizza. Simple ingredients, proper technique.",
    tags: ["quick lunch", "date night"]
  },
  {
    id: "the-depot-pizza-wichita",
    name: "The Depot Pizza & Taps",
    cuisine: "Pizza",
    lat: 37.6862, lng: -97.3355,
    googleMapsUrl: "https://www.google.com/maps/place/The+Depot+Pizza+%26+Taps/",
    notes: "Pizza and craft beer. Perfect combo for a casual team outing.",
    tags: ["team dinner"]
  },
  // Upscale / Noteworthy (2)
  {
    id: "the-monarch-wichita",
    name: "The Monarch",
    cuisine: "American",
    lat: 37.6875, lng: -97.3365,
    googleMapsUrl: "https://www.google.com/maps/place/The+Monarch/",
    notes: "One of Wichita's best. Seasonal menu, craft cocktails, great atmosphere.",
    tags: ["date night", "must-try"]
  },
  {
    id: "the-belmont-wichita",
    name: "The Belmont",
    cuisine: "American",
    lat: 37.6845, lng: -97.3325,
    googleMapsUrl: "https://www.google.com/maps/place/The+Belmont/",
    notes: "Top-rated on Yelp. Upscale American with a strong cocktail program.",
    tags: ["date night", "team dinner"]
  },
];

const allNew = wichitaRestaurants.map(r => ({
  ...r,
  tier: "on_my_radar",
  dateAdded: today,
  source: "web research",
}));

const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const existingIds = new Set(existing.map(r => r.id));
const toInsert = allNew.filter(r => !existingIds.has(r.id));

console.log(`Wichita: ${toInsert.length} new restaurants (${allNew.length - toInsert.length} already exist)`);

if (DRY_RUN) {
  toInsert.forEach(r => console.log(`  + ${r.id}: ${r.name} (${r.cuisine})`));
  process.exit(0);
}

existing.push(...toInsert);
fs.writeFileSync(JSON_PATH, JSON.stringify(existing, null, 2));
console.log(`Wrote to restaurants.json (total: ${existing.length})`);

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_URL && SERVICE_ROLE_KEY) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('restaurants').insert(toInsert).select('id');
  if (error) { console.error('Supabase insert failed:', error.message); process.exit(1); }
  console.log(`Inserted ${data.length} into Supabase.`);
}

console.log(`Run 'node scripts/enrich-places.mjs' next.`);
