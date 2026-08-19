import { z } from "zod";

/**
 * What the AI enhancement step produces from a raw feedback note.
 * Mirrors FeedbackEntry's content/howAddressed fields minus
 * id/title/date/sentiment/source/link, which are supplied by the
 * user, not inferred — sentiment in particular is the user's own
 * classification of feedback they received, not the AI's to judge.
 */
export const FeedbackEnhancementResultSchema = z.object({
  content: z.string().min(1).describe(
    "A polished rewrite of the raw feedback content. Preserve the original " +
      "meaning exactly — do not soften, strengthen, or add specifics not " +
      "present in the raw input.",
  ),
  howAddressed: z.string().nullable().describe(
    "A polished rewrite of how the feedback was addressed, if the raw input " +
      "describes an action taken. Null if it doesn't.",
  ),
  clarifyingQuestions: z.array(z.string()).max(3).describe(
    "Up to 3 short questions to ask the user if the raw input is too vague " +
      "for a confident rewrite. Empty array if none are needed.",
  ),
});

export type FeedbackEnhancementResult = z.infer<typeof FeedbackEnhancementResultSchema>;
