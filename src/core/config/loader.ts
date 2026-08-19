import { promises as fs } from "node:fs";
import path from "node:path";
import { ConfigError } from "../errors.js";
import { BragConfigSchema, DEFAULT_CONFIG, type BragConfig } from "./schema.js";

const CONFIG_FILENAME = "brag.config.json";

/** Walks up from `startDir` looking for brag.config.json; returns null if none is found. */
export async function findConfigPath(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILENAME);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Not present at this level — keep walking up.
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Loads and validates brag.config.json. Falls back to DEFAULT_CONFIG
 * when no config file exists — a fresh directory works without
 * requiring `brag init` first. An existing file is validated
 * strictly (no silent gap-filling); a missing or invalid field is a
 * hard ConfigError, same as a malformed brag.md.
 */
export async function loadConfig(explicitPath?: string): Promise<BragConfig> {
  const configPath = explicitPath ?? (await findConfigPath(process.cwd()));
  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  let raw: string;
  try {
    raw = await fs.readFile(configPath, "utf8");
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ConfigError(`Could not read config at ${configPath}: ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ConfigError(`${configPath}: invalid JSON (${message})`);
  }

  const result = BragConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new ConfigError(`${configPath}: ${issues}`);
  }
  return result.data;
}
