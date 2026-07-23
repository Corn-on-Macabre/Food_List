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

// Quick-pick chips shown in the admin editors — a curated subset of
// TAG_VOCABULARY so admin-applied tags always match the public filter.
// (satisfies keeps each entry checked against TAG_VOCABULARY while exposing
// a plain string[] so .includes() accepts arbitrary user input)
export const SUGGESTED_TAGS: readonly string[] =
  ['date night', 'quick lunch', 'patio', 'kid friendly'] satisfies readonly Tag[];
