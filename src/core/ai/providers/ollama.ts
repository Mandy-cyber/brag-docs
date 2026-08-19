import { Ollama } from "ollama";
import type { AiProvider, ContextPack } from "../types.js";

export class OllamaProvider implements AiProvider {
  readonly name = "ollama";

  constructor(
    private readonly client: Ollama,
    private readonly model: string,
  ) {}

  async complete(
    rawInput: string,
    jsonSchema: Record<string, unknown>,
    contextPack: ContextPack,
  ): Promise<unknown> {
    const messages = [
      { role: "system", content: contextPack.systemPrompt },
      ...contextPack.fewShotExamples.flatMap((example) => [
        { role: "user", content: example.rawInput },
        { role: "assistant", content: JSON.stringify(example.output) },
      ]),
      { role: "user", content: rawInput },
    ];

    const response = await this.client.chat({
      model: this.model,
      messages,
      format: jsonSchema,
      stream: false,
    });

    if (!response.message.content) {
      throw new Error("Ollama response had no content.");
    }
    return JSON.parse(response.message.content);
  }
}
