/**
 * Converts a restaurant name to a URL-safe slug ID.
 * Examples:
 *   "Pho 43"          → "pho-43"
 *   "Tacos El Patrón" → "tacos-el-patron"
 *   "J&G Steakhouse"  → "j-g-steakhouse"
 */
export function generateSlugId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')               // decompose accents
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks (é → e)
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (except space, dash)
    .trim()
    .replace(/\s+/g, '-')           // spaces → dashes
    .replace(/-+/g, '-')            // collapse multiple dashes
    .slice(0, 60);
}

/**
 * Like generateSlugId but guarantees uniqueness by appending -2, -3, etc.
 * when the base slug already exists in the provided IDs list.
 */
export function generateUniqueSlugId(name: string, existingIds: string[]): string {
  const base = generateSlugId(name);
  if (!existingIds.includes(base)) return base;
  let counter = 2;
  while (existingIds.includes(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}
