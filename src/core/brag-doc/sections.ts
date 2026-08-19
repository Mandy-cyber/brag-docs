import type { BragDoc } from "./types.js";
import type { BragEntry, BragType } from "./schema.js";

/** The largest metric value across all of an entry's impacts, or null if it has none. */
function maxMetricValue(entry: BragEntry): number | null {
  const values = entry.impacts.flatMap((impact) => impact.metrics.map((metric) => metric.value));
  return values.length > 0 ? Math.max(...values) : null;
}

/**
 * Sorts entries by their largest impact metric descending (entries
 * without one sort last), then date descending.
 */
export function sortByImpactThenDate(entries: BragEntry[]): BragEntry[] {
  return [...entries].sort((a, b) => {
    const aValue = maxMetricValue(a);
    const bValue = maxMetricValue(b);
    if (aValue !== null && bValue !== null && aValue !== bValue) {
      return bValue - aValue;
    }
    if (aValue !== null && bValue === null) return -1;
    if (aValue === null && bValue !== null) return 1;
    return b.date.localeCompare(a.date);
  });
}

/** Groups entries by type, each group internally sorted by impact then date. */
export function groupByType(entries: BragEntry[]): Map<BragType, BragEntry[]> {
  const groups = new Map<BragType, BragEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.type);
    if (group) {
      group.push(entry);
    } else {
      groups.set(entry.type, [entry]);
    }
  }
  for (const [type, group] of groups) {
    groups.set(type, sortByImpactThenDate(group));
  }
  return groups;
}

/**
 * A compact, plain-text summary of every entry (title, type, date,
 * impacts) — the raw input handed to the executive-summary AI
 * context pack. Kept in core rather than the CLI layer since any
 * future consumer of this engine (e.g. a website) would need the
 * same digest.
 */
export function buildEntriesDigest(doc: BragDoc): string {
  const describe = (entry: BragEntry): string => {
    const impacts = entry.impacts.map((impact) => impact.statement).join("; ");
    return `- [${entry.type}] ${entry.title} (${entry.date}): ${impacts}`;
  };
  return [...doc.entries, ...doc.outsideWork].map(describe).join("\n");
}
