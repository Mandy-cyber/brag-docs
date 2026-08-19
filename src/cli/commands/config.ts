import path from "node:path";
import { promises as fs } from "node:fs";
import type { Command } from "commander";
import { BragConfigSchema } from "../../core/config/schema.js";
import { findConfigPath, loadConfig } from "../../core/config/loader.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ConfigError } from "../../core/errors.js";
import { getGlobalOptions } from "../context.js";

/**
 * Reads brag.config.json as plain JSON, without schema validation.
 * Used by `config set` so a config that's missing a field added by a
 * newer version of this tool can still be patched — validation runs
 * afterward, against the result of the patch, not the input.
 */
async function readRawConfig(configPath: string): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await fs.readFile(configPath, "utf8");
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ConfigError(`Could not read config at ${configPath}: ${message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ConfigError(`${configPath}: invalid JSON (${message})`);
  }
}

function getPath(obj: unknown, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function setPath(obj: Record<string, unknown>, dottedPath: string, value: unknown): void {
  const keys = dottedPath.split(".");
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const next = target[key];
    if (typeof next !== "object" || next === null) {
      throw new ConfigError(`No such config path: ${dottedPath}`);
    }
    target = next as Record<string, unknown>;
  }
  target[keys.at(-1)!] = value;
}

/** Parses a CLI value string as JSON when possible, else keeps it as a plain string. */
function coerceValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Inspect or edit brag.config.json");

  config
    .command("get <key>")
    .description("Print a config value (dotted path)")
    .action(async (key: string, _opts: unknown, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const loaded = await loadConfig(globals.config);
      const value = getPath(loaded, key);
      if (value === undefined) {
        throw new ConfigError(`No such config path: ${key}`);
      }
      console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
    });

  config
    .command("list")
    .description("Print the full effective config")
    .action(async (_opts: unknown, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const loaded = await loadConfig(globals.config);
      console.log(JSON.stringify(loaded, null, 2));
    });

  config
    .command("set <key> <value>")
    .description("Set a config value (dotted path) and write it back")
    .action(async (key: string, value: string, _opts: unknown, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const configPath = globals.config ?? (await findConfigPath(process.cwd()));
      if (!configPath) {
        throw new ConfigError('No brag.config.json found — run "brag init" first.');
      }

      const draft = await readRawConfig(configPath);
      setPath(draft, key, coerceValue(value));

      const result = BragConfigSchema.safeParse(draft);
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        throw new ConfigError(`Invalid value for ${key}: ${issues}`);
      }

      await writeFileAtomic(path.resolve(configPath), JSON.stringify(result.data, null, 2) + "\n");
      console.log(`Set ${key} = ${value}`);
    });
}
