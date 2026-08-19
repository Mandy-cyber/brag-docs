import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { loadConfig } from "../core/config/loader.js";
import type { BragConfig } from "../core/config/schema.js";
import { parseBragDoc } from "../core/brag-doc/parser.js";
import type { BragDoc } from "../core/brag-doc/types.js";
import { ConfigError } from "../core/errors.js";

export interface GlobalOptions {
  config?: string;
  doc?: string;
  json?: boolean;
  quiet?: boolean;
}

export function getGlobalOptions(cmd: Command): GlobalOptions {
  return cmd.optsWithGlobals<GlobalOptions>();
}

/** Resolves brag.config.json (or defaults) plus the effective docPath, honoring --config/--doc. */
export async function resolveConfig(
  opts: GlobalOptions,
): Promise<{ config: BragConfig; docPath: string }> {
  const config = await loadConfig(opts.config);
  const docPath = path.resolve(opts.doc ?? config.docPath);
  return { config, docPath };
}

/** Loads and parses brag.md at `docPath`. Throws a clear ConfigError if it doesn't exist yet. */
export async function loadDoc(docPath: string): Promise<BragDoc> {
  let source: string;
  try {
    source = await fs.readFile(docPath, "utf8");
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigError(`No brag.md found at ${docPath} — run "brag init" first.`);
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ConfigError(`Could not read ${docPath}: ${message}`);
  }
  return parseBragDoc(source);
}
