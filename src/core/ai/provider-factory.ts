import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Ollama } from "ollama";
import type { BragConfig } from "../config/schema.js";
import { ConfigError } from "../errors.js";
import type { AiProvider } from "./types.js";
import { ClaudeProvider } from "./providers/claude.js";
import { OpenAiProvider } from "./providers/openai.js";
import { OllamaProvider } from "./providers/ollama.js";
import { ClaudeCliProvider } from "./providers/claude-cli.js";

export type AiProviderName = "claude" | "openai" | "ollama" | "claude-cli";

function requireApiKey(envVar: string, providerLabel: string): string {
  const key = process.env[envVar];
  if (!key) {
    throw new ConfigError(
      `${providerLabel} requires the ${envVar} environment variable to be set.`,
    );
  }
  return key;
}

/**
 * Resolves the Claude Code CLI binary to invoke. If the user hasn't
 * customized it away from the default "claude", prefer
 * CLAUDE_CODE_EXECPATH when set — this is how a nested/sandboxed
 * Claude Code session (like this one) exposes its own binary path,
 * which may not otherwise be on PATH.
 */
function resolveClaudeCliBinary(configuredBinary: string): string {
  if (configuredBinary !== "claude") return configuredBinary;
  return process.env.CLAUDE_CODE_EXECPATH || "claude";
}

/** Builds the requested AiProvider from config, reading API keys only from env vars. */
export function createAiProvider(name: AiProviderName, config: BragConfig): AiProvider {
  switch (name) {
    case "claude": {
      const apiKey = requireApiKey(config.ai.claude.apiKeyEnvVar, "Claude");
      return new ClaudeProvider(new Anthropic({ apiKey }), config.ai.claude.model);
    }
    case "openai": {
      const apiKey = requireApiKey(config.ai.openai.apiKeyEnvVar, "OpenAI");
      return new OpenAiProvider(new OpenAI({ apiKey }), config.ai.openai.model);
    }
    case "ollama": {
      const client = new Ollama({ host: config.ai.ollama.host });
      return new OllamaProvider(client, config.ai.ollama.model);
    }
    case "claude-cli": {
      const binary = resolveClaudeCliBinary(config.ai.claudeCli.binary);
      return new ClaudeCliProvider(binary, config.ai.claudeCli.model);
    }
  }
}
