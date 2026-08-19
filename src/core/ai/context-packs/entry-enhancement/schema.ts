import { z } from "zod";
import { BRAG_TYPES } from "../../../brag-doc/schema.js";

const ImpactMetricSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
});

const ImpactSchema = z.object({
  statement: z.string().min(1),
  metrics: z.array(ImpactMetricSchema).describe(
    "Zero or more clean numbers backing this specific impact. Only include a " +
      "number that is stated or directly implied in the input — never fabricate one.",
  ),
});

/**
 * What the AI enhancement step produces from a raw, informal brag
 * description. Deliberately mirrors BragEntry's shape (title,
 * impacts) so the CLI can apply it with minimal translation, but
 * stays a separate schema since the AI's job is narrower than the
 * full entry (no id, date, role, collaborators, or link — those are
 * supplied by the user, not inferred).
 */
export const EnhancementResultSchema = z.object({
  title: z.string().min(1).describe("A short, resume-appropriate title for this brag."),
  description: z.string().min(1).describe(
    "A polished rewrite of the raw input's narrative. Do not invent facts, " +
      "numbers, or claims not present in the raw input.",
  ),
  impacts: z.array(ImpactSchema).min(1).describe(
    "One or more distinct impacts drawn from the raw input. If the input " +
      "only supports one, return an array of length one.",
  ),
  suggestedType: z.enum(BRAG_TYPES).describe(
    'Best-fit category from this exact list. "other" is a valid, non-penalized ' +
      "choice when nothing fits well.",
  ),
  clarifyingQuestions: z.array(z.string()).max(3).describe(
    "Up to 3 short questions to ask the user if the raw input is too vague " +
      "for a confident description or impact. Empty array if none are needed.",
  ),
});

export type EnhancementResult = z.infer<typeof EnhancementResultSchema>;
