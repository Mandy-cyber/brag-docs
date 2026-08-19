import path from "node:path";
import { promises as fs } from "node:fs";
import type { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import type { BragDoc } from "../../core/brag-doc/types.js";
import { DEFAULT_CONFIG } from "../../core/config/schema.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ConfigError } from "../../core/errors.js";
import { getGlobalOptions } from "../context.js";

interface InitOptions {
  dir: string;
  force: boolean;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Scaffold a new brag.md and brag.config.json")
    .option("--dir <path>", "target directory", ".")
    .option("--force", "overwrite an existing brag.md", false)
    .action(async (opts: InitOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const dir = path.resolve(opts.dir);
      const docPath = path.join(dir, "brag.md");
      const configPath = path.join(dir, "brag.config.json");

      if ((await pathExists(docPath)) && !opts.force) {
        throw new ConfigError(`${docPath} already exists — pass --force to overwrite.`);
      }

      await fs.mkdir(dir, { recursive: true });

      let title = "Brag Document";
      if (!globals.quiet) {
        clack.intro("brag init");
        const answer = await clack.text({
          message: "What name should this brag document use?",
          placeholder: "e.g. your name",
        });
        if (!clack.isCancel(answer) && answer.trim().length > 0) {
          title = answer.trim();
        }
      }

      const doc: BragDoc = {
        meta: {
          schemaVersion: 1,
          lastUpdated: new Date().toISOString().slice(0, 10),
          generatedBy: "brag-docs@0.1.0",
        },
        title,
        executiveSummary: "",
        entries: [],
        learned: [],
        feedback: [],
        outsideWork: [],
      };

      await writeFileAtomic(docPath, serializeBragDoc(doc));
      await writeFileAtomic(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");

      const message = `Created ${docPath} and ${configPath}`;
      if (!globals.quiet) {
        clack.outro(pc.green(message));
      } else {
        console.log(message);
      }
    });
}
