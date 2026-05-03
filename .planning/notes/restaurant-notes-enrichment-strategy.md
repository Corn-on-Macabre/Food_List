---
title: Restaurant notes enrichment strategy
date: 2026-04-18
context: Explored in /gsd-explore session — deciding how to populate notes for all 592 restaurants before sharing the site publicly
---

## Current State

- 592 total restaurants in restaurants.json
- 57 have detailed, personal notes (the gold standard)
- 235 have short/generic notes ("Great burger")
- 300 have no notes at all

## Key Decisions

### Tier-aware note generation
- **Loved / Recommended** (been there): Notes should reflect personal experience — standout dish, vibe, specific memory. AI drafts from reviews in Bobby's voice.
- **On My Radar** (haven't been): Notes should reflect why it's interesting — what looks good, what people rave about, why it's worth trying.

### Data sources
- **Google Places API** — reviews (up to 5), ratings, price level. Already have API key.
- **Yelp Fusion API** — more food-focused reviews, "popular dishes" feature. Free tier: 500 calls/day.
- **Google Maps "Popular dishes"** — specific dish names with photos.

### AI drafting approach
- Feed Google + Yelp reviews into Claude
- Use the 57 best existing notes as style examples (few-shot prompting)
- Output tone: casual, personal, specific — like a friend texting you where to eat
- Tier determines the voice (experience vs discovery)

### Review workflow
- Script outputs drafts (Notion database or CSV for review)
- Bobby reviews/edits in admin dashboard
- Publish when satisfied

### Scope
- One-time batch script (not recurring)
- Future enhancement: auto-generate notes when adding a new restaurant via admin
