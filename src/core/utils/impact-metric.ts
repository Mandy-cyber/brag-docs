import type { ImpactMetric } from "../brag-doc/schema.js";

/**
 * Parses a single free-text metric like "40% faster" or "$50,000
 * saved annually" into a structured ImpactMetric by pulling out the
 * first number and treating the rest as the unit. Returns null when
 * no number is found, or when nothing is left to serve as a unit
 * (e.g. the input was just "40").
 */
export function parseImpactMetric(raw: string): ImpactMetric | null {
  const match = raw.match(/-?[\d,]+(?:\.\d+)?/);
  if (!match || match.index === undefined) return null;

  const value = Number(match[0].replace(/,/g, ""));
  if (Number.isNaN(value)) return null;

  const unit = (raw.slice(0, match.index) + raw.slice(match.index + match[0].length))
    .replace(/\s+/g, " ")
    .trim();
  if (unit.length === 0) return null;

  return { value, unit };
}
