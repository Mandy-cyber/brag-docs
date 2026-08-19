import type { ContextPack } from "../types.js";
import { ENTRY_ENHANCEMENT_SYSTEM_PROMPT } from "./entry-enhancement/system-prompt.js";
import { ENTRY_ENHANCEMENT_EXAMPLES } from "./entry-enhancement/few-shot-examples.js";
import { EXECUTIVE_SUMMARY_SYSTEM_PROMPT } from "./executive-summary/system-prompt.js";

export { EnhancementResultSchema, type EnhancementResult } from "./entry-enhancement/schema.js";
export {
  ExecutiveSummaryResultSchema,
  type ExecutiveSummaryResult,
} from "./executive-summary/schema.js";

export const entryEnhancementContextPack: ContextPack = {
  systemPrompt: ENTRY_ENHANCEMENT_SYSTEM_PROMPT,
  fewShotExamples: ENTRY_ENHANCEMENT_EXAMPLES,
};

export const executiveSummaryContextPack: ContextPack = {
  systemPrompt: EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
  fewShotExamples: [],
};
