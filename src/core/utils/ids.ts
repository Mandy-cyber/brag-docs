/**
 * Generates a stable, human-legible entry id from a date and
 * title, e.g. "2026-03-14-shipped-cache".
 */
export function generateEntryId(date: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug.length > 0 ? `${date}-${slug}` : date;
}
