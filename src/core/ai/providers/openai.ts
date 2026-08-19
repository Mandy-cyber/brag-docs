import OpenAI from "openai";
import type { AiProvider, ContextPack } from "../types.js";

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async complete(
    rawInput: string,
    jsonSchema: Record<string, unknown>,
    contextPack: ContextPack,
  ): Promise<unknown> {
    const input: OpenAI.Responses.ResponseInput = [
      ...contextPack.fewShotExamples.flatMap(
        (example): OpenAI.Responses.ResponseInput => [
          { role: "user", content: example.rawInput },
          { role: "assistant", content: JSON.stringify(example.output) },
        ],
      ),
      { role: "user", content: rawInput },
    ];

    const response = await this.client.responses.create({
      model: this.model,
      instructions: contextPack.systemPrompt,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "brag_docs_ai_result",
          schema: jsonSchema,
          strict: true,
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI response had no text content.");
    }
    return JSON.parse(response.output_text);
  }
}
