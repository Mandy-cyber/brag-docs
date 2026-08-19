import type { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { FeedbackEntrySchema, type FeedbackEntry } from "../../core/brag-doc/schema.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { generateEntryId } from "../../core/utils/ids.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import { promptSelect, promptText } from "../prompts.js";

interface FeedbackAddOptions {
  date?: string;
  sentiment?: string;
  source?: string;
  content?: string;
  howAddressed?: string;
  link?: string;
  dryRun?: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function collectInteractively(): Promise<Omit<FeedbackEntry, "id" | "title">> {
  clack.intro("brag feedback add");

  const sentiment = await promptSelect<"positive" | "constructive">({
    message: "Was this positive or constructive feedback?",
    options: [
      { value: "positive", label: "Positive" },
      { value: "constructive", label: "Constructive" },
    ],
  });
  const date = await promptText({ message: "Date (YYYY-MM-DD)", defaultValue: today() });
  const source = await promptText({
    message: "Who was this from?",
    defaultValue: "",
    placeholder: "e.g. Jane Doe",
  });
  const content = await promptText({ message: "What was the feedback?" });
  const howAddressed =
    sentiment === "constructive"
      ? await promptText({
          message: "How have you addressed it? (blank if not yet)",
          defaultValue: "",
        })
      : "";
  const link = await promptText({
    message: "Link (blank for none)",
    defaultValue: "",
  });

  clack.outro(pc.green("Got it."));

  return {
    date,
    sentiment,
    source: source.trim().length > 0 ? source.trim() : null,
    content,
    howAddressed: howAddressed.trim().length > 0 ? howAddressed.trim() : null,
    link: link.trim().length > 0 ? link.trim() : null,
  };
}

function collectFromFlags(opts: FeedbackAddOptions): Omit<FeedbackEntry, "id" | "title"> {
  if (!opts.sentiment || !opts.content) {
    throw new ValidationError(
      "Non-interactive `brag feedback add` requires at least --sentiment and --content.",
    );
  }
  if (opts.sentiment !== "positive" && opts.sentiment !== "constructive") {
    throw new ValidationError('--sentiment must be "positive" or "constructive".');
  }
  return {
    date: opts.date ?? today(),
    sentiment: opts.sentiment,
    source: opts.source ?? null,
    content: opts.content,
    howAddressed: opts.howAddressed ?? null,
    link: opts.link ?? null,
  };
}

export function registerFeedbackCommand(program: Command): void {
  const feedback = program.command("feedback").description("Manage feedback entries");

  feedback
    .command("add")
    .description("Add a feedback entry")
    .option("--date <date>", "date (YYYY-MM-DD)")
    .option("--sentiment <sentiment>", "positive or constructive")
    .option("--source <text>", "who the feedback came from")
    .option("--content <text>", "the feedback itself")
    .option("--how-addressed <text>", "how it was addressed (constructive feedback)")
    .option("--link <url>", "link to additional context")
    .option("--dry-run", "print the entry without writing it", false)
    .action(async (opts: FeedbackAddOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { docPath } = await resolveConfig(globals);

      const fields = opts.sentiment ? collectFromFlags(opts) : await collectInteractively();
      const title =
        fields.sentiment === "constructive"
          ? `Constructive feedback: ${fields.content.slice(0, 60)}`
          : `Positive feedback: ${fields.content.slice(0, 60)}`;
      const id = generateEntryId(fields.date, title);
      const entry = FeedbackEntrySchema.parse({ id, title, ...fields });

      if (opts.dryRun) {
        console.log(JSON.stringify(entry, null, 2));
        return;
      }

      const doc = await loadDoc(docPath);
      doc.feedback.push(entry);
      doc.meta.lastUpdated = today();

      await writeFileAtomic(docPath, serializeBragDoc(doc));

      if (!globals.quiet) {
        console.log(pc.green(`Added feedback entry to ${docPath}`));
      }
    });
}
