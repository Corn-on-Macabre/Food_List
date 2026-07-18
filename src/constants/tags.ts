// Fixed occasion/vibe tag vocabulary. Keep in sync with TAG_VOCABULARY in
// server/data.js — the MCP tools and extraction pipeline validate against it.
export const TAG_VOCABULARY = [
  'must-try',
  'date night',
  'team dinner',
  'quick lunch',
  'breakfast',
  'brunch',
  'coffee',
  'dessert',
  'late night',
  'drinks',
  'patio',
  'kid friendly',
  'casual',
  'special occasion',
  'takeout',
] as const;

export type Tag = (typeof TAG_VOCABULARY)[number];
