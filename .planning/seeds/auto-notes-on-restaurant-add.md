---
title: Auto-generate notes on restaurant addition
trigger_condition: When the one-time enrichment script is complete and Bobby is happy with the note quality
planted_date: 2026-04-18
---

## Idea

When adding a new restaurant through the admin dashboard, automatically generate a draft note using the same enrichment pipeline (Google/Yelp reviews → Claude → draft in Bobby's voice).

## Why Wait

- Need to validate the enrichment approach works well first (one-time script)
- Need Bobby's feedback on AI-drafted note quality before automating
- The admin add-restaurant flow already works — this is an enhancement, not a fix

## When to Activate

- One-time enrichment script has run successfully
- Bobby has reviewed and approved the quality of AI-drafted notes
- The note generation prompt and style examples are locked in

## Scope When Activated

- Add a "Generate note" button to the admin add-restaurant form
- After a restaurant is saved, auto-call the enrichment pipeline for that one restaurant
- Show the draft note inline for immediate editing before final save
