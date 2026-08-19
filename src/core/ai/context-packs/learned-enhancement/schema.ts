import { z } from "zod";
import { LEARNED_CATEGORIES } from "../../../brag-doc/schema.js";

/**
 * What the AI enhancement step produces from a raw "what I've
 * learned" note. Mirrors LearnedEntry's shape minus id/date/link,
 * which are supplied by the user, not inferred.
 */
export const LearnedEnhancementResultSchema = z.object({
  title: z.string().min(1).describe("A short, clear title for what was learned."),
  description: z.string().min(1).describe(
    "A polished rewrite of the raw input's narrative. Do not invent facts, " +
      "tools, or claims not present in the raw input.",
  ),
  suggestedCategory: z.enum(LEARNED_CATEGORIES).describe(
    'Best-fit category from this exact list. "other" is a valid, non-penalized ' +
      "choice when nothing fits well.",
  ),
  clarifyingQuestions: z.array(z.string()).max(3).describe(
    "Up to 3 short questions to ask the user if the raw input is too vague " +
      "for a confident description. Empty array if none are needed.",
  ),
});

export type LearnedEnhancementResult = z.infer<typeof LearnedEnhancementResultSchema>;
