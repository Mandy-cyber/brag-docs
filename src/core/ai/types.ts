/** A worked example pairing raw input with the structured output it should produce. */
export interface FewShotExample {
  rawInput: string;
  output: unknown;
}

/**
 * The prompt + examples fed to whichever provider is active,
 * shared across providers for consistency.
 */
export interface ContextPack {
  systemPrompt: string;
  fewShotExamples: FewShotExample[];
}

/**
 * A single AI backend. Returns the raw parsed JSON the model produced —
 * not yet zod-validated. `core/ai/enhance.ts` owns validation and
 * retry, so that logic lives in exactly one place regardless of
 * which provider is active.
 */
export interface AiProvider {
  readonly name: string;
  complete(
    rawInput: string,
    jsonSchema: Record<string, unknown>,
    contextPack: ContextPack,
  ): Promise<unknown>;
}
