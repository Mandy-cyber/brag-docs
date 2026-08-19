import type { Command } from "commander";
import pc from "picocolors";
import type { BragEntry } from "../../core/brag-doc/schema.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import { enhanceEntry, resolveProviderName, type AiProviderName } from "../ai.js";
import { promptConfirm } from "../prompts.js";
import type { BragConfig } from "../../core/config/schema.js";

interface EnhanceOptions {
  provider?: string;
  all?: boolean;
  autoApply?: boolean;
}

function buildRawInput(entry: BragEntry): string {
  const impactLines = entry.impacts
    .map((impact) => {
      const metrics = impact.metrics.map((m) => `${m.value} ${m.unit}`).join(", ");
      return `- ${impact.statement}${metrics ? ` (${metrics})` : ""}`;
    })
    .join("\n");
  return [entry.title, entry.description, "Impact:", impactLines].filter(Boolean).join("\n\n");
}

function findEntry(entries: BragEntry[], id: string): BragEntry | undefined {
  return entries.find((entry) => entry.id === id);
}

/** Enhances one entry in place, printing a diff and asking for confirmation unless `autoApply`. */
async function enhanceOne(
  entry: BragEntry,
  providerName: AiProviderName,
  config: BragConfig,
  autoApply: boolean,
): Promise<boolean> {
  console.log(pc.dim(`\nEnhancing "${entry.title}"...`));
  const result = await enhanceEntry(buildRawInput(entry), providerName, config);

  console.log(`${pc.bold("Suggested title:")} ${result.title}`);
  console.log(`${pc.bold("Suggested description:")} ${result.description}`);
  console.log(pc.bold("Suggested impacts:"));
  for (const impact of result.impacts) {
    const metrics = impact.metrics.map((m) => `${m.value} ${m.unit}`).join(", ");
    console.log(`  - ${impact.statement}${metrics ? ` (${metrics})` : ""}`);
  }
  if (result.suggestedType !== entry.type) {
    console.log(
      `${pc.bold("Suggested category:")} ${result.suggestedType} (currently ${entry.type})`,
    );
  }
  if (result.clarifyingQuestions.length > 0) {
    console.log(pc.yellow("The AI had questions:"));
    for (const question of result.clarifyingQuestions) {
      console.log(`  - ${question}`);
    }
  }

  const apply =
    autoApply ||
    (await promptConfirm({ message: "Apply this to the entry?", initialValue: false }));
  if (!apply) {
    console.log(pc.dim("Left unchanged."));
    return false;
  }

  entry.title = result.title;
  entry.description = result.description;
  entry.impacts = result.impacts;
  console.log(pc.green(`Updated "${entry.title}"`));
  return true;
}

export function registerEnhanceCommand(program: Command): void {
  program
    .command("enhance [entryId]")
    .description("Re-run AI enhancement on one entry, or every entry with --all")
    .option("--all", "enhance every brag/outside-work entry", false)
    .option("--auto-apply", "apply suggestions without asking per entry (use with --all)", false)
    .option("--provider <provider>", "claude, openai, ollama, or claude-cli")
    .action(async (entryId: string | undefined, opts: EnhanceOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { config, docPath } = await resolveConfig(globals);
      const doc = await loadDoc(docPath);
      const providerName = resolveProviderName(opts.provider, config);

      if (!opts.all && !entryId) {
        throw new ValidationError("Pass an entry id, or use --all to enhance every entry.");
      }
      if (opts.all && entryId) {
        throw new ValidationError("Pass either an entry id or --all, not both.");
      }

      const targets = opts.all ? [...doc.entries, ...doc.outsideWork] : [];
      if (entryId) {
        const entry = findEntry(doc.entries, entryId) ?? findEntry(doc.outsideWork, entryId);
        if (!entry) {
          throw new ValidationError(`No entry with id "${entryId}" found in ${docPath}`);
        }
        targets.push(entry);
      }

      let changed = 0;
      for (const entry of targets) {
        const applied = await enhanceOne(entry, providerName, config, Boolean(opts.autoApply));
        if (applied) changed++;
      }

      if (changed === 0) {
        console.log(pc.dim("\nNo changes to write."));
        return;
      }

      await writeFileAtomic(docPath, serializeBragDoc(doc));
      console.log(pc.green(`\nUpdated ${changed} of ${targets.length} entries in ${docPath}`));
    });
}
