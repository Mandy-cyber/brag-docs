import type { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import {
  LEARNED_CATEGORIES,
  LearnedEntrySchema,
  type LearnedCategory,
  type LearnedEntry,
} from "../../core/brag-doc/schema.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { generateEntryId } from "../../core/utils/ids.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import { promptSelect, promptText } from "../prompts.js";

interface LearnedAddOptions {
  date?: string;
  category?: string;
  title?: string;
  description?: string;
  link?: string;
  dryRun?: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function collectInteractively(): Promise<Omit<LearnedEntry, "id">> {
  clack.intro("brag learned add");

  const title = await promptText({ message: "Title of this learning" });
  const date = await promptText({ message: "Date (YYYY-MM-DD)", defaultValue: today() });
  const category = await promptSelect<LearnedCategory>({
    message: "Category",
    options: LEARNED_CATEGORIES.map((value) => ({ value, label: value })),
  });
  const description = await promptText({
    message: "What did you learn?",
    defaultValue: "",
  });
  const link = await promptText({
    message: "Link (blank for none)",
    defaultValue: "",
  });

  clack.outro(pc.green("Got it."));

  return {
    title,
    date,
    category,
    description,
    link: link.trim().length > 0 ? link.trim() : null,
  };
}

function collectFromFlags(opts: LearnedAddOptions): Omit<LearnedEntry, "id"> {
  if (!opts.title || !opts.category) {
    throw new ValidationError(
      "Non-interactive `brag learned add` requires at least --title and --category.",
    );
  }
  return {
    title: opts.title,
    date: opts.date ?? today(),
    category: opts.category as LearnedCategory,
    description: opts.description ?? "",
    link: opts.link ?? null,
  };
}

export function registerLearnedCommand(program: Command): void {
  const learned = program.command("learned").description("Manage \"what I've learned\" entries");

  learned
    .command("add")
    .description("Add a learned entry")
    .option("--date <date>", "date (YYYY-MM-DD)")
    .option("--category <category>", "library, tool, technique, or other")
    .option("--title <title>", "short title")
    .option("--description <text>", "longer description")
    .option("--link <url>", "link to additional context")
    .option("--dry-run", "print the entry without writing it", false)
    .action(async (opts: LearnedAddOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { docPath } = await resolveConfig(globals);

      const fields = opts.title ? collectFromFlags(opts) : await collectInteractively();
      const id = generateEntryId(fields.date, fields.title);
      const entry = LearnedEntrySchema.parse({ id, ...fields });

      if (opts.dryRun) {
        console.log(JSON.stringify(entry, null, 2));
        return;
      }

      const doc = await loadDoc(docPath);
      doc.learned.push(entry);
      doc.meta.lastUpdated = today();

      await writeFileAtomic(docPath, serializeBragDoc(doc));

      if (!globals.quiet) {
        console.log(pc.green(`Added learned entry to ${docPath}`));
      }
    });
}
