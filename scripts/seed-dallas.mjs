#!/usr/bin/env node
// Seeds ~40 Dallas restaurants into public/restaurants.json
// All entries start as "on_my_radar" tier with source "web research"
//
// Usage: node scripts/seed-dallas.mjs [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'public/restaurants.json');
const DRY_RUN = process.argv.includes('--dry-run');

const today = new Date().toISOString().slice(0, 10);

const dallasRestaurants = [
  // === BBQ (6) ===
  {
    id: "pecan-lodge-dallas",
    name: "Pecan Lodge",
    cuisine: "BBQ",
    lat: 32.7842, lng: -96.7854,
    googleMapsUrl: "https://www.google.com/maps/place/Pecan+Lodge/",
    notes: "Deep Ellum icon. Beef rib smoked 12+ hours, legendary brisket. Expect a line but it moves fast.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "terry-blacks-dallas",
    name: "Terry Black's Barbecue",
    cuisine: "BBQ",
    lat: 32.7870, lng: -96.7822,
    googleMapsUrl: "https://www.google.com/maps/place/Terry+Black's+Barbecue/",
    notes: "Deep Ellum. Melt-in-your-mouth brisket, pork and beef ribs, creamed corn. Austin transplant done right.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "cattleack-barbeque-dallas",
    name: "Cattleack Barbeque",
    cuisine: "BBQ",
    lat: 32.9290, lng: -96.7695,
    googleMapsUrl: "https://www.google.com/maps/place/Cattleack+Barbeque/",
    notes: "Only open Thu-Sat, sells out fast. Some of the best brisket in Dallas. Worth the planning.",
    tags: ["must-try"]
  },
  {
    id: "lockhart-smokehouse-dallas",
    name: "Lockhart Smokehouse",
    cuisine: "BBQ",
    lat: 32.7476, lng: -96.8270,
    googleMapsUrl: "https://www.google.com/maps/place/Lockhart+Smokehouse/",
    notes: "Bishop Arts District. Central Texas-style BBQ inspired by Kreuz Market in Lockhart.",
    tags: ["quick lunch"]
  },
  {
    id: "oakd-dallas",
    name: "OAK'D",
    cuisine: "BBQ",
    lat: 32.8159, lng: -96.8165,
    googleMapsUrl: "https://www.google.com/maps/place/OAK'D/",
    notes: "Modern, chef-driven BBQ with a full bar and spacious patio. Feels more restaurant than smokehouse.",
    tags: ["team dinner", "patio"]
  },
  {
    id: "smokey-joes-dallas",
    name: "Smokey Joe's",
    cuisine: "BBQ",
    lat: 32.7330, lng: -96.8540,
    googleMapsUrl: "https://www.google.com/maps/place/Smokey+Joe's/",
    notes: "Oak Cliff classic since 1985. Best ribs in North Texas according to locals.",
    tags: ["quick lunch"]
  },

  // === TEX-MEX (5) ===
  {
    id: "mias-tex-mex-dallas",
    name: "Mia's Tex-Mex",
    cuisine: "Tex-Mex",
    lat: 32.8070, lng: -96.8040,
    googleMapsUrl: "https://www.google.com/maps/place/Mia's+Tex-Mex/",
    notes: "Dallas legend. Famous brisket tacos. Many a business deal has been made over plates here.",
    tags: ["quick lunch", "team dinner"]
  },
  {
    id: "mi-cocina-dallas",
    name: "Mi Cocina",
    cuisine: "Tex-Mex",
    lat: 32.8370, lng: -96.8040,
    googleMapsUrl: "https://www.google.com/maps/place/Mi+Cocina/",
    notes: "Dallas Tex-Mex institution since 1991. Known for the Mambo Taxi margarita and brisket tacos.",
    tags: ["team dinner"]
  },
  {
    id: "mesero-victory-park-dallas",
    name: "Mesero",
    cuisine: "Tex-Mex",
    lat: 32.7901, lng: -96.8099,
    googleMapsUrl: "https://www.google.com/maps/place/Mesero/",
    notes: "Victory Park. Famous Queso Mesero and brisket tacos. Lively scene.",
    tags: ["team dinner", "date night"]
  },
  {
    id: "avilas-dallas",
    name: "Avila's Mexican Restaurant",
    cuisine: "Tex-Mex",
    lat: 32.8240, lng: -96.7860,
    googleMapsUrl: "https://www.google.com/maps/place/Avila's+Mexican+Restaurant/",
    notes: "Family-run since 1986. Classic enchiladas and chile rellenos. Old-school Dallas Tex-Mex.",
    tags: ["quick lunch"]
  },
  {
    id: "marianos-hacienda-dallas",
    name: "Mariano's Hacienda Ranch",
    cuisine: "Tex-Mex",
    lat: 32.9340, lng: -96.8230,
    googleMapsUrl: "https://www.google.com/maps/place/Mariano's+Hacienda+Ranch/",
    notes: "Where the frozen margarita was invented in 1971. A Slurpee machine was the secret.",
    tags: ["team dinner"]
  },

  // === TACOS (4) ===
  {
    id: "revolver-taco-lounge-dallas",
    name: "Revolver Taco Lounge",
    cuisine: "Mexican",
    lat: 32.7870, lng: -96.7840,
    googleMapsUrl: "https://www.google.com/maps/place/Revolver+Taco+Lounge/",
    notes: "Texas Monthly top 50 tacos. Creative tacos like pulpo al pastor with grilled octopus. Deep Ellum.",
    tags: ["must-try", "date night"]
  },
  {
    id: "la-salsa-verde-taqueria-dallas",
    name: "La Salsa Verde Taqueria",
    cuisine: "Mexican",
    lat: 32.7750, lng: -96.7670,
    googleMapsUrl: "https://www.google.com/maps/place/La+Salsa+Verde+Taqueria/",
    notes: "Tacos de cabeza and outstanding birria. Authentic street-style.",
    tags: ["quick lunch"]
  },
  {
    id: "dragon-casa-dallas",
    name: "Dragon Casa",
    cuisine: "Fusion",
    lat: 32.9350, lng: -96.7700,
    googleMapsUrl: "https://www.google.com/maps/place/Dragon+Casa/",
    notes: "Chinese-Mexican fusion. Peking duck tacos and birria xiao long bao. North Dallas.",
    tags: ["date night"]
  },
  {
    id: "taco-king-plano",
    name: "Taco King",
    cuisine: "Mexican",
    lat: 33.0198, lng: -96.6989,
    googleMapsUrl: "https://www.google.com/maps/place/Taco+King/",
    notes: "Halal tacos blending Mexican and Levantine spices. Signature King Taco with asiago costra. Plano.",
    tags: ["quick lunch"]
  },

  // === ASIAN (7) ===
  {
    id: "sushi-kozy-dallas",
    name: "Sushi Kozy",
    cuisine: "Japanese",
    lat: 32.8120, lng: -96.7980,
    googleMapsUrl: "https://www.google.com/maps/place/Sushi+Kozy/",
    notes: "Texas Monthly best new restaurant 2026. Uchi alum Paul Ko. Omakase and creative rolls.",
    tags: ["date night", "must-try"]
  },
  {
    id: "nobu-dallas",
    name: "Nobu Dallas",
    cuisine: "Japanese",
    lat: 32.7990, lng: -96.8010,
    googleMapsUrl: "https://www.google.com/maps/place/Nobu+Dallas/",
    notes: "Hotel Crescent Court. Black cod with miso, fresh sashimi, signature Nobu classics.",
    tags: ["date night"]
  },
  {
    id: "ka-tip-dallas",
    name: "Ka-Tip Thai Kitchen",
    cuisine: "Thai",
    lat: 32.7780, lng: -96.7960,
    googleMapsUrl: "https://www.google.com/maps/place/Ka-Tip+Thai+Kitchen/",
    notes: "Dallas Farmers Market area. Authentic Thai — dumplings are the star. Great matcha tea.",
    tags: ["quick lunch"]
  },
  {
    id: "royal-thai-dallas",
    name: "Royal Thai",
    cuisine: "Thai",
    lat: 32.8050, lng: -96.8150,
    googleMapsUrl: "https://www.google.com/maps/place/Royal+Thai/",
    notes: "Famous Thai teas and classic Pad Thai. Dim lighting, vibrant decor, great value.",
    tags: ["quick lunch", "date night"]
  },
  {
    id: "ngon-vietnamese-dallas",
    name: "Ngon Vietnamese Kitchen",
    cuisine: "Vietnamese",
    lat: 32.8350, lng: -96.7730,
    googleMapsUrl: "https://www.google.com/maps/place/Ngon+Vietnamese+Kitchen/",
    notes: "Best pho in Dallas. Spicy bun bo hue, fresh spring rolls, beautifully spiced curries.",
    tags: ["quick lunch", "must-try"]
  },
  {
    id: "malai-kitchen-dallas",
    name: "Malai Kitchen",
    cuisine: "Thai-Vietnamese",
    lat: 32.7960, lng: -96.8050,
    googleMapsUrl: "https://www.google.com/maps/place/Malai+Kitchen/",
    notes: "Uptown. Thai-Vietnamese fusion with a lively bar scene. Three DFW locations.",
    tags: ["team dinner"]
  },
  {
    id: "ten-ramen-dallas",
    name: "TEN Ramen",
    cuisine: "Japanese",
    lat: 32.8210, lng: -96.8190,
    googleMapsUrl: "https://www.google.com/maps/place/TEN+Ramen/",
    notes: "Hidden gem on Lemmon Ave. Contender for best ramen in Dallas.",
    tags: ["quick lunch"]
  },

  // === BURGERS (4) ===
  {
    id: "bar-sardine-dallas",
    name: "Bar Sardine",
    cuisine: "American",
    lat: 32.8380, lng: -96.8010,
    googleMapsUrl: "https://www.google.com/maps/place/Bar+Sardine/",
    notes: "Park Cities French bistro where the burger is the star — ~50 sold daily. Stylish spot.",
    tags: ["quick lunch", "date night"]
  },
  {
    id: "kellers-drive-in-dallas",
    name: "Keller's Drive-In",
    cuisine: "American",
    lat: 32.8600, lng: -96.7700,
    googleMapsUrl: "https://www.google.com/maps/place/Keller's+Drive-In/",
    notes: "Classic Dallas drive-in. Same burger prep for generations. Cash only.",
    tags: ["quick lunch"]
  },
  {
    id: "hopdoddy-dallas",
    name: "Hopdoddy Burger Bar",
    cuisine: "American",
    lat: 32.7980, lng: -96.8060,
    googleMapsUrl: "https://www.google.com/maps/place/Hopdoddy+Burger+Bar/",
    notes: "Uptown. Premium ingredients, Goodnight Good Cause burger. Craft beer selection.",
    tags: ["quick lunch", "team dinner"]
  },
  {
    id: "la-burger-carrollton",
    name: "LA Burger",
    cuisine: "Korean-American",
    lat: 32.9690, lng: -96.8900,
    googleMapsUrl: "https://www.google.com/maps/place/LA+Burger/",
    notes: "Korean fusion burgers — Korean Fried Chicken Burger and Bulgogi Beef Burger. Carrollton.",
    tags: ["quick lunch"]
  },

  // === SOUTHERN / SOUL FOOD (4) ===
  {
    id: "roots-southern-table-dallas",
    name: "Roots Southern Table",
    cuisine: "Southern",
    lat: 32.9260, lng: -96.8870,
    googleMapsUrl: "https://www.google.com/maps/place/Roots+Southern+Table/",
    notes: "Farmers Branch. James Beard finalist. Duck-fat fried chicken is the move.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "hatties-hot-chicken-dallas",
    name: "Hattie B's Hot Chicken",
    cuisine: "Southern",
    lat: 32.7850, lng: -96.7850,
    googleMapsUrl: "https://www.google.com/maps/place/Hattie+B's+Hot+Chicken/",
    notes: "Deep Ellum. Nashville hot chicken with great sides — mac and cheese, collard greens.",
    tags: ["quick lunch"]
  },
  {
    id: "sweet-georgia-brown-dallas",
    name: "Sweet Georgia Brown",
    cuisine: "Soul Food",
    lat: 32.7620, lng: -96.8180,
    googleMapsUrl: "https://www.google.com/maps/place/Sweet+Georgia+Brown/",
    notes: "Dallas soul food staple for decades. Fried chicken, meatloaf, cabbage, black-eyed peas.",
    tags: ["quick lunch"]
  },
  {
    id: "streets-fine-chicken-dallas",
    name: "Street's Fine Chicken",
    cuisine: "Southern",
    lat: 32.7760, lng: -96.7960,
    googleMapsUrl: "https://www.google.com/maps/place/Street's+Fine+Chicken/",
    notes: "Southern fried chicken — crispy outside, tender inside. Louisiana-inspired flavors.",
    tags: ["quick lunch"]
  },

  // === PIZZA (3) ===
  {
    id: "cane-rosso-dallas",
    name: "Cane Rosso",
    cuisine: "Pizza",
    lat: 32.7870, lng: -96.7830,
    googleMapsUrl: "https://www.google.com/maps/place/Cane+Rosso/",
    notes: "Started the Dallas craft pizza craze. Naples-certified. Try the Honey Bastard pizza.",
    tags: ["team dinner"]
  },
  {
    id: "enos-pizza-tavern-dallas",
    name: "Eno's Pizza Tavern",
    cuisine: "Pizza",
    lat: 32.7475, lng: -96.8280,
    googleMapsUrl: "https://www.google.com/maps/place/Eno's+Pizza+Tavern/",
    notes: "Bishop Arts. Chicago tavern-style thin crust. Local ingredients, house-made sausage.",
    tags: ["team dinner", "patio"]
  },
  {
    id: "pizzana-dallas",
    name: "Pizzana",
    cuisine: "Pizza",
    lat: 32.8350, lng: -96.8050,
    googleMapsUrl: "https://www.google.com/maps/place/Pizzana/",
    notes: "Neo-Neapolitan. 48-hour fermented dough. The cacio e pepe pizza is spectacular.",
    tags: ["date night"]
  },

  // === STEAKHOUSE (3) ===
  {
    id: "yo-ranch-steakhouse-dallas",
    name: "Y.O. Ranch Steakhouse",
    cuisine: "Steakhouse",
    lat: 32.7850, lng: -96.7990,
    googleMapsUrl: "https://www.google.com/maps/place/Y.O.+Ranch+Steakhouse/",
    notes: "The defining Dallas steakhouse. Food Network called it one of the nation's finest.",
    tags: ["team dinner", "must-try"]
  },
  {
    id: "nuri-dallas",
    name: "Nuri",
    cuisine: "Steakhouse",
    lat: 32.7930, lng: -96.8030,
    googleMapsUrl: "https://www.google.com/maps/place/Nuri/",
    notes: "World's 101 Best Steak Restaurants list. WSJ 'Steakhouses Worth the Splurge.'",
    tags: ["date night"]
  },
  {
    id: "pappas-bros-steakhouse-dallas",
    name: "Pappas Bros. Steakhouse",
    cuisine: "Steakhouse",
    lat: 32.8660, lng: -96.7730,
    googleMapsUrl: "https://www.google.com/maps/place/Pappas+Bros.+Steakhouse/",
    notes: "Classic Texas steakhouse. USDA Prime beef dry-aged in-house. Consistently excellent.",
    tags: ["team dinner"]
  },

  // === WILD CARD (3) ===
  {
    id: "oni-ramen-dallas",
    name: "Oni Ramen",
    cuisine: "Japanese",
    lat: 32.7880, lng: -96.7850,
    googleMapsUrl: "https://www.google.com/maps/place/Oni+Ramen/",
    notes: "Deep Ellum. Latin twist on traditional ramen. Unique fusion that works.",
    tags: ["quick lunch"]
  },
  {
    id: "hawkers-asian-street-food-dallas",
    name: "Hawkers Asian Street Food",
    cuisine: "Asian Fusion",
    lat: 32.7890, lng: -96.7830,
    googleMapsUrl: "https://www.google.com/maps/place/Hawkers+Asian+Street+Food/",
    notes: "One-stop shop for Chinese, Japanese, Korean, Vietnamese, and Thai street food favorites.",
    tags: ["quick lunch", "team dinner"]
  },
  {
    id: "ferah-smokehouse-cantina-dallas",
    name: "Ferah Smokehouse & Cantina",
    cuisine: "BBQ-Mexican Fusion",
    lat: 32.7900, lng: -96.8000,
    googleMapsUrl: "https://www.google.com/maps/place/Ferah+Smokehouse+%26+Cantina/",
    notes: "BBQ meets Tex-Mex. Smoked brisket tacos with fresh tortillas. Best of both worlds.",
    tags: ["team dinner"]
  },
];

// Add standard fields to all entries
const seeded = dallasRestaurants.map((r) => ({
  ...r,
  tier: "on_my_radar",
  dateAdded: today,
  source: "web research",
}));

// Read existing data, append, write
const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const existingIds = new Set(existing.map((r) => r.id));
const newEntries = seeded.filter((r) => !existingIds.has(r.id));
const skipped = seeded.length - newEntries.length;

if (DRY_RUN) {
  console.log(`[DRY RUN] Would add ${newEntries.length} Dallas restaurants (${skipped} already exist)`);
  newEntries.forEach((r) => console.log(`  + ${r.id}: ${r.name} (${r.cuisine})`));
} else {
  existing.push(...newEntries);
  fs.writeFileSync(JSON_PATH, JSON.stringify(existing, null, 2));
  console.log(`Added ${newEntries.length} Dallas restaurants (${skipped} skipped as duplicates)`);
  console.log(`Total restaurants: ${existing.length}`);
  console.log(`\nRun 'node scripts/enrich-places.mjs' to populate ratings, photos, and prices.`);
}
