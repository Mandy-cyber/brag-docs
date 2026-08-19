import type { BragConfig } from "../core/config/schema.js";
import { createAiProvider, type AiProviderName } from "../core/ai/provider-factory.js";
import { enhance } from "../core/ai/enhance.js";
import {
  entryEnhancementContextPack,
  executiveSummaryContextPack,
  learnedEnhancementContextPack,
  feedbackEnhancementContextPack,
  EnhancementResultSchema,
  ExecutiveSummaryResultSchema,
  LearnedEnhancementResultSchema,
  FeedbackEnhancementResultSchema,
  type EnhancementResult,
  type ExecutiveSummaryResult,
  type LearnedEnhancementResult,
  type FeedbackEnhancementResult,
} from "../core/ai/context-packs/index.js";
import { ConfigError } from "../core/errors.js";

export type { AiProviderName } from "../core/ai/provider-factory.js";

const PROVIDER_NAMES: AiProviderName[] = ["claude", "openai", "ollama", "claude-cli"];

/**
 * Resolves the provider name from --provider (if given) or the
 * config default, and validates it.
 */
export function resolveProviderName(
  flag: string | undefined,
  config: BragConfig,
): AiProviderName {
  const name = flag ?? config.ai.defaultProvider;
  if (!PROVIDER_NAMES.includes(name as AiProviderName)) {
    throw new ConfigError(
      `Unknown AI provider "${name}" — expected one of: ${PROVIDER_NAMES.join(", ")}`,
    );
  }
  return name as AiProviderName;
}

/**
 * Constructs (and discards) the provider client to surface a
 * missing API key immediately — before any interactive prompts run,
 * rather than after the user has typed something.
 */
export function assertProviderReady(providerName: AiProviderName, config: BragConfig): void {
  createAiProvider(providerName, config);
}

export async function enhanceEntry(
  rawInput: string,
  providerName: AiProviderName,
  config: BragConfig,
): Promise<EnhancementResult> {
  const provider = createAiProvider(providerName, config);
  return enhance(provider, rawInput, EnhancementResultSchema, entryEnhancementContextPack);
}

export async function enhanceLearned(
  rawInput: string,
  providerName: AiProviderName,
  config: BragConfig,
): Promise<LearnedEnhancementResult> {
  const provider = createAiProvider(providerName, config);
  return enhance(
    provider,
    rawInput,
    LearnedEnhancementResultSchema,
    learnedEnhancementContextPack,
  );
}

export async function enhanceFeedback(
  rawInput: string,
  providerName: AiProviderName,
  config: BragConfig,
): Promise<FeedbackEnhancementResult> {
  const provider = createAiProvider(providerName, config);
  return enhance(
    provider,
    rawInput,
    FeedbackEnhancementResultSchema,
    feedbackEnhancementContextPack,
  );
}

export async function generateExecutiveSummary(
  entriesDigest: string,
  providerName: AiProviderName,
  config: BragConfig,
): Promise<ExecutiveSummaryResult> {
  const provider = createAiProvider(providerName, config);
  return enhance(
    provider,
    entriesDigest,
    ExecutiveSummaryResultSchema,
    executiveSummaryContextPack,
  );
}
