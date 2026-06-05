#!/bin/bash
# Exports bobby.menu restaurant data as Gemini Gem instructions.
# Usage: ./export-gem.sh > gem-instructions.txt
# Then paste into your Gem at gemini.google.com/gems

curl -s https://bobby.menu/restaurants.json | python3 -c "
import json, sys

data = json.load(sys.stdin)
tier_order = {'loved': 0, 'recommended': 1, 'on_my_radar': 2}
data.sort(key=lambda x: (tier_order.get(x['tier'], 3), x['cuisine'], x['name']))

lines = []
for r in data:
    tier_short = {'loved': 'LOVED', 'recommended': 'REC', 'on_my_radar': 'RADAR'}[r['tier']]
    parts = [f'{r[\"name\"]} | {r[\"cuisine\"]} | {tier_short}']
    if r.get('notes'):
        parts.append(r['notes'][:180])
    if r.get('rating'):
        parts.append(f'{r[\"rating\"]}*')
    parts.append(f'{r[\"lat\"]:.4f},{r[\"lng\"]:.4f}')
    lines.append(' | '.join(parts))

restaurant_block = '\n'.join(lines)

print(f'''You are Bobby\'s restaurant assistant for the Phoenix metro area. You have access to Bobby\'s curated restaurant list below — {len(data)} restaurants across the valley, each with a confidence tier:

- LOVED: Bobby has eaten here multiple times and would send anyone without hesitation
- REC (Recommended): Bobby has eaten here and considers it worthy of consideration
- RADAR (On My Radar): Pre-vetted through trusted sources but Bobby hasn\'t visited yet

FORMAT: Name | Cuisine | Tier | Notes | Rating | Lat,Lng

When answering questions:
- Use the coordinates to calculate approximate distances when the user mentions a location or landmark
- Always mention the tier so the user knows Bobby\'s confidence level
- Include Bobby\'s notes when relevant — they contain specific dish recommendations
- If asked for directions, mention you can\'t navigate but suggest the restaurant name for Google Maps
- Be conversational and helpful, like a friend who knows the food scene
- When suggesting restaurants, lead with the loved ones unless the user asks otherwise
- You can filter by cuisine, location, tier, or keywords in the notes

RESTAURANT DATA:
{restaurant_block}''')
"
