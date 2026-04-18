---
name: Build one-time notes enrichment script
description: Batch script that pulls Google/Yelp reviews for all 592 restaurants and generates AI-drafted notes
type: todo
date: 2026-04-18
priority: high
---

## Task

Build a standalone Node.js script that enriches restaurant notes for all 592 restaurants in restaurants.json.

## Approach

1. For each restaurant, call Google Places API and Yelp Fusion API to pull reviews and popular dishes
2. Feed reviews + restaurant metadata (name, cuisine, tier) into Claude API
3. Use the 57 best existing notes as few-shot style examples
4. Generate tier-aware drafts:
   - Loved/Recommended: personal experience tone ("The carne asada burrito. Salsa roja on the side.")
   - On My Radar: discovery tone ("Known for the wood-fired pizza. Multiple friends have recommended.")
5. Output to a reviewable format (Notion database or JSON/CSV)
6. After Bobby's review, bulk-update restaurants.json via the Express API

## Data Sources

- Google Places API (key already available as GOOGLE_API_KEY)
- Yelp Fusion API (need API key — free tier 500 calls/day)

## Dependencies

- Yelp Fusion API key (need to register)
- Claude API key for note generation
- Existing: Google Places API key, restaurants.json, Express API
