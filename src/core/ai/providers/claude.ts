import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, ContextPack } from "../types.js";

export class ClaudeProvider implements AiProvider {
  readonly name = "claude";

  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async complete(
    rawInput: string,
    jsonSchema: Record<string, unknown>,
    contextPack: ContextPack,
  ): Promise<unknown> {
    const messages: Anthropic.MessageParam[] = [
      ...contextPack.fewShotExamples.flatMap(
        (example): Anthropic.MessageParam[] => [
          { role: "user", content: example.rawInput },
          { role: "assistant", content: JSON.stringify(example.output) },
        ],
      ),
      { role: "user", content: rawInput },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: contextPack.systemPrompt,
      messages,
      output_config: { format: { type: "json_schema", schema: jsonSchema } },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("Claude declined to respond to this request.");
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      throw new Error(`Claude response had no text content (stop_reason: ${response.stop_reason})`);
    }
    return JSON.parse(textBlock.text);
  }
}
