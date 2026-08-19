import { spawn } from "node:child_process";
import type { AiProvider, ContextPack } from "../types.js";

interface ClaudeCliEnvelope {
  is_error: boolean;
  result?: string;
  structured_output?: unknown;
}

function buildPrompt(rawInput: string, contextPack: ContextPack): string {
  if (contextPack.fewShotExamples.length === 0) return rawInput;
  const examples = contextPack.fewShotExamples
    .map(
      (example, i) =>
        `Example ${i + 1} input:\n${example.rawInput}\n\n` +
        `Example ${i + 1} output:\n${JSON.stringify(example.output)}`,
    )
    .join("\n\n");
  return `${examples}\n\nNow process this input:\n${rawInput}`;
}

function run(binary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `"${binary}" was not found on PATH — install Claude Code, or use a different provider.`,
          ),
        );
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim() || "no output"}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Shells out to a locally installed Claude Code CLI in non-interactive
 * mode, using whatever authentication the user already has (subscription
 * login or API key) — no separate ANTHROPIC_API_KEY required for this
 * provider specifically. Tool access is explicitly disabled (`--tools ""`)
 * since this is a pure text-in/JSON-out completion, not an agentic task.
 */
export class ClaudeCliProvider implements AiProvider {
  readonly name = "claude-cli";

  constructor(
    private readonly binary: string,
    private readonly model: string | null,
  ) {}

  async complete(
    rawInput: string,
    jsonSchema: Record<string, unknown>,
    contextPack: ContextPack,
  ): Promise<unknown> {
    const args = [
      "-p",
      buildPrompt(rawInput, contextPack),
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(jsonSchema),
      "--system-prompt",
      contextPack.systemPrompt,
      "--tools",
      "",
    ];
    if (this.model) {
      args.push("--model", this.model);
    }

    const stdout = await run(this.binary, args);

    let envelope: ClaudeCliEnvelope;
    try {
      envelope = JSON.parse(stdout);
    } catch {
      throw new Error("claude CLI produced non-JSON output.");
    }

    if (envelope.is_error) {
      throw new Error(`claude CLI returned an error: ${envelope.result ?? "unknown error"}`);
    }
    if (envelope.structured_output === undefined) {
      throw new Error("claude CLI did not return structured output.");
    }
    return envelope.structured_output;
  }
}
