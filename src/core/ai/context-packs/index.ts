import type { ContextPack } from "../types.js";
import { ENTRY_ENHANCEMENT_SYSTEM_PROMPT } from "./entry-enhancement/system-prompt.js";
import { ENTRY_ENHANCEMENT_EXAMPLES } from "./entry-enhancement/few-shot-examples.js";
import { EXECUTIVE_SUMMARY_SYSTEM_PROMPT } from "./executive-summary/system-prompt.js";
import { LEARNED_ENHANCEMENT_SYSTEM_PROMPT } from "./learned-enhancement/system-prompt.js";
import { LEARNED_ENHANCEMENT_EXAMPLES } from "./learned-enhancement/few-shot-examples.js";
import { FEEDBACK_ENHANCEMENT_SYSTEM_PROMPT } from "./feedback-enhancement/system-prompt.js";
import { FEEDBACK_ENHANCEMENT_EXAMPLES } from "./feedback-enhancement/few-shot-examples.js";

export { EnhancementResultSchema, type EnhancementResult } from "./entry-enhancement/schema.js";
export {
  ExecutiveSummaryResultSchema,
  type ExecutiveSummaryResult,
} from "./executive-summary/schema.js";
export {
  LearnedEnhancementResultSchema,
  type LearnedEnhancementResult,
} from "./learned-enhancement/schema.js";
export {
  FeedbackEnhancementResultSchema,
  type FeedbackEnhancementResult,
} from "./feedback-enhancement/schema.js";

export const entryEnhancementContextPack: ContextPack = {
  systemPrompt: ENTRY_ENHANCEMENT_SYSTEM_PROMPT,
  fewShotExamples: ENTRY_ENHANCEMENT_EXAMPLES,
};

export const executiveSummaryContextPack: ContextPack = {
  systemPrompt: EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
  fewShotExamples: [],
};

export const learnedEnhancementContextPack: ContextPack = {
  systemPrompt: LEARNED_ENHANCEMENT_SYSTEM_PROMPT,
  fewShotExamples: LEARNED_ENHANCEMENT_EXAMPLES,
};

export const feedbackEnhancementContextPack: ContextPack = {
  systemPrompt: FEEDBACK_ENHANCEMENT_SYSTEM_PROMPT,
  fewShotExamples: FEEDBACK_ENHANCEMENT_EXAMPLES,
};
