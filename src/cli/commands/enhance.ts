import type { Command } from "commander";
import pc from "picocolors";
import type { BragEntry, FeedbackEntry, LearnedEntry } from "../../core/brag-doc/schema.js";
import type { BragDoc } from "../../core/brag-doc/types.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import {
  enhanceEntry,
  enhanceLearned,
  enhanceFeedback,
  resolveProviderName,
  type AiProviderName,
} from "../ai.js";
import { promptConfirm } from "../prompts.js";
import type { BragConfig } from "../../core/config/schema.js";

interface EnhanceOptions {
  provider?: string;
  all?: boolean;
  autoApply?: boolean;
}

type Target =
  | { kind: "brag"; entry: BragEntry }
  | { kind: "learned"; entry: LearnedEntry }
  | { kind: "feedback"; entry: FeedbackEntry };

function buildBragRawInput(entry: BragEntry): string {
  const impactLines = entry.impacts
    .map((impact) => {
      const metrics = impact.metrics.map((m) => `${m.value} ${m.unit}`).join(", ");
      return `- ${impact.statement}${metrics ? ` (${metrics})` : ""}`;
    })
    .join("\n");
  return [entry.title, entry.description, "Impact:", impactLines].filter(Boolean).join("\n\n");
}

function buildLearnedRawInput(entry: LearnedEntry): string {
  return [entry.title, entry.description].filter(Boolean).join("\n\n");
}

function buildFeedbackRawInput(entry: FeedbackEntry): string {
  const lines = [`Feedback (${entry.sentiment}): ${entry.content}`];
  if (entry.howAddressed) lines.push(`How it was addressed so far: ${entry.howAddressed}`);
  return lines.join("\n\n");
}

function findTarget(doc: BragDoc, id: string): Target | undefined {
  const brag = doc.entries.find((e) => e.id === id) ?? doc.outsideWork.find((e) => e.id === id);
  if (brag) return { kind: "brag", entry: brag };
  const learned = doc.learned.find((e) => e.id === id);
  if (learned) return { kind: "learned", entry: learned };
  const feedback = doc.feedback.find((e) => e.id === id);
  if (feedback) return { kind: "feedback", entry: feedback };
  return undefined;
}

function allTargets(doc: BragDoc): Target[] {
  return [
    ...doc.entries.map((entry): Target => ({ kind: "brag", entry })),
    ...doc.outsideWork.map((entry): Target => ({ kind: "brag", entry })),
    ...doc.learned.map((entry): Target => ({ kind: "learned", entry })),
    ...doc.feedback.map((entry): Target => ({ kind: "feedback", entry })),
  ];
}

async function confirmApply(autoApply: boolean): Promise<boolean> {
  return autoApply || (await promptConfirm({ message: "Apply this to the entry?", initialValue: false }));
}

function printClarifyingQuestions(questions: string[]): void {
  if (questions.length === 0) return;
  console.log(pc.yellow("The AI had questions:"));
  for (const question of questions) console.log(`  - ${question}`);
}

async function enhanceBragTarget(
  entry: BragEntry,
  providerName: AiProviderName,
  config: BragConfig,
  autoApply: boolean,
): Promise<boolean> {
  const result = await enhanceEntry(buildBragRawInput(entry), providerName, config);

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
  printClarifyingQuestions(result.clarifyingQuestions);

  if (!(await confirmApply(autoApply))) {
    console.log(pc.dim("Left unchanged."));
    return false;
  }

  entry.title = result.title;
  entry.description = result.description;
  entry.impacts = result.impacts;
  console.log(pc.green(`Updated "${entry.title}"`));
  return true;
}

async function enhanceLearnedTarget(
  entry: LearnedEntry,
  providerName: AiProviderName,
  config: BragConfig,
  autoApply: boolean,
): Promise<boolean> {
  const result = await enhanceLearned(buildLearnedRawInput(entry), providerName, config);

  console.log(`${pc.bold("Suggested title:")} ${result.title}`);
  console.log(`${pc.bold("Suggested description:")} ${result.description}`);
  if (result.suggestedCategory !== entry.category) {
    console.log(
      `${pc.bold("Suggested category:")} ${result.suggestedCategory} (currently ${entry.category})`,
    );
  }
  printClarifyingQuestions(result.clarifyingQuestions);

  if (!(await confirmApply(autoApply))) {
    console.log(pc.dim("Left unchanged."));
    return false;
  }

  entry.title = result.title;
  entry.description = result.description;
  entry.category = result.suggestedCategory;
  console.log(pc.green(`Updated "${entry.title}"`));
  return true;
}

async function enhanceFeedbackTarget(
  entry: FeedbackEntry,
  providerName: AiProviderName,
  config: BragConfig,
  autoApply: boolean,
): Promise<boolean> {
  const result = await enhanceFeedback(buildFeedbackRawInput(entry), providerName, config);

  console.log(`${pc.bold("Suggested content:")} ${result.content}`);
  if (result.howAddressed) {
    console.log(`${pc.bold("Suggested how-addressed:")} ${result.howAddressed}`);
  }
  printClarifyingQuestions(result.clarifyingQuestions);

  if (!(await confirmApply(autoApply))) {
    console.log(pc.dim("Left unchanged."));
    return false;
  }

  entry.content = result.content;
  entry.howAddressed = result.howAddressed;
  console.log(pc.green(`Updated feedback entry "${entry.id}"`));
  return true;
}

/** Enhances one target in place, printing a diff and asking for confirmation unless `autoApply`. */
async function enhanceOne(
  target: Target,
  providerName: AiProviderName,
  config: BragConfig,
  autoApply: boolean,
): Promise<boolean> {
  const label =
    target.kind === "feedback" ? `feedback entry "${target.entry.id}"` : `"${target.entry.title}"`;
  console.log(pc.dim(`\nEnhancing ${label}...`));

  switch (target.kind) {
    case "brag":
      return enhanceBragTarget(target.entry, providerName, config, autoApply);
    case "learned":
      return enhanceLearnedTarget(target.entry, providerName, config, autoApply);
    case "feedback":
      return enhanceFeedbackTarget(target.entry, providerName, config, autoApply);
  }
}

export function registerEnhanceCommand(program: Command): void {
  program
    .command("enhance [entryId]")
    .description("Re-run AI enhancement on one entry, or every entry with --all")
    .option("--all", "enhance every brag, outside-work, learned, and feedback entry", false)
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

      const targets = opts.all ? allTargets(doc) : [];
      if (entryId) {
        const target = findTarget(doc, entryId);
        if (!target) {
          throw new ValidationError(`No entry with id "${entryId}" found in ${docPath}`);
        }
        targets.push(target);
      }

      let changed = 0;
      for (const target of targets) {
        const applied = await enhanceOne(target, providerName, config, Boolean(opts.autoApply));
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
