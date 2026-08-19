import type { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import {
  BRAG_TYPES,
  CONTRIBUTION_ROLES,
  OUTSIDE_WORK_TYPES,
  BragEntrySchema,
  type BragEntry,
  type BragType,
  type ContributionRole,
  type Impact,
  type ImpactMetric,
} from "../../core/brag-doc/schema.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { generateEntryId } from "../../core/utils/ids.js";
import { parseImpactMetric } from "../../core/utils/impact-metric.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import type { BragConfig } from "../../core/config/schema.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import {
  assertProviderReady,
  enhanceEntry,
  resolveProviderName,
  type AiProviderName,
} from "../ai.js";
import { promptConfirm, promptSelect, promptText } from "../prompts.js";

interface AddOptions {
  date?: string;
  role?: string;
  type?: string;
  title?: string;
  description?: string;
  impact?: string;
  impactMetric?: string;
  collaborators?: string;
  link?: string;
  enhance?: boolean;
  provider?: string;
  dryRun?: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const OUTSIDE_WORK_TYPE_SET = new Set<string>(OUTSIDE_WORK_TYPES);

async function collectMetrics(): Promise<ImpactMetric[]> {
  const metrics: ImpactMetric[] = [];
  let addAnother = await promptConfirm({
    message: "Is there a number backing this up (helps with sorting/ranking)?",
    initialValue: false,
  });
  while (addAnother) {
    const raw = await promptText({
      message: "Number and what it measures",
      placeholder: "e.g. 40% faster",
    });
    const metric = parseImpactMetric(raw);
    if (metric) {
      metrics.push(metric);
    }
    addAnother = await promptConfirm({
      message: "Add another number for this impact?",
      initialValue: false,
    });
  }
  return metrics;
}

async function collectImpacts(): Promise<Impact[]> {
  const impacts: Impact[] = [];
  let addAnother = true;
  while (addAnother) {
    const statement = await promptText({
      message: impacts.length === 0 ? "What was the impact?" : "Describe the next impact",
    });
    const metrics = await collectMetrics();
    impacts.push({ statement, metrics });
    addAnother = await promptConfirm({
      message: "Did this also have another kind of impact?",
      initialValue: false,
    });
  }
  return impacts;
}

/**
 * Runs the raw input through AI enhancement and returns a
 * title/description/impacts/type to seed the rest of the prompts
 * with, or null if the user declines the suggestion.
 */
async function collectViaEnhancement(
  providerName: AiProviderName,
  config: BragConfig,
): Promise<{ title: string; description: string; impacts: Impact[]; type: BragType } | null> {
  const rawInput = await promptText({
    message: "Tell me what you did, roughly — I'll help polish it",
  });

  console.log(pc.dim(`Enhancing with ${providerName}...`));
  const result = await enhanceEntry(rawInput, providerName, config);

  console.log(`\n${pc.bold("Title:")} ${result.title}`);
  console.log(`${pc.bold("Description:")} ${result.description}`);
  console.log(pc.bold("Impacts:"));
  for (const impact of result.impacts) {
    const metrics = impact.metrics.map((m) => `${m.value} ${m.unit}`).join(", ");
    console.log(`  - ${impact.statement}${metrics ? ` (${metrics})` : ""}`);
  }
  console.log(`${pc.bold("Suggested category:")} ${result.suggestedType}`);
  if (result.clarifyingQuestions.length > 0) {
    console.log(`\n${pc.yellow("The AI had questions:")}`);
    for (const question of result.clarifyingQuestions) {
      console.log(`  - ${question}`);
    }
  }

  const useIt = await promptConfirm({ message: "\nUse this?", initialValue: true });
  if (!useIt) return null;

  return {
    title: result.title,
    description: result.description,
    impacts: result.impacts,
    type: result.suggestedType,
  };
}

async function collectInteractively(
  enhanceWith: { providerName: AiProviderName; config: BragConfig } | null,
): Promise<Omit<BragEntry, "id">> {
  clack.intro("brag add");

  const enhanced = enhanceWith
    ? await collectViaEnhancement(enhanceWith.providerName, enhanceWith.config)
    : null;

  const title = enhanced ? enhanced.title : await promptText({ message: "Title of this brag" });
  const date = await promptText({ message: "Date (YYYY-MM-DD)", defaultValue: today() });
  const type = await promptSelect<BragType>({
    message: "Category",
    options: BRAG_TYPES.map((value) => ({ value, label: value })),
    ...(enhanced ? { initialValue: enhanced.type } : {}),
  });
  const role = await promptSelect<ContributionRole | "none">({
    message: "Your role in this",
    options: [
      { value: "none", label: "n/a" },
      ...CONTRIBUTION_ROLES.map((value) => ({ value, label: value })),
    ],
  });
  const description = enhanced
    ? enhanced.description
    : await promptText({ message: "Describe this briefly", defaultValue: "" });
  const impacts = enhanced ? enhanced.impacts : await collectImpacts();
  const collaboratorsRaw = await promptText({
    message: "Collaborators (comma-separated, blank for none)",
    defaultValue: "",
  });
  const link = await promptText({
    message: "Link (PR, ticket, doc — blank for none)",
    defaultValue: "",
  });

  clack.outro(pc.green("Got it."));

  return {
    title,
    date,
    type,
    role: role === "none" ? null : role,
    description,
    impacts,
    collaborators: collaboratorsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    link: link.trim().length > 0 ? link.trim() : null,
  };
}

function collectFromFlags(opts: AddOptions): Omit<BragEntry, "id"> {
  if (!opts.title || !opts.type || !opts.impact) {
    throw new ValidationError(
      "Non-interactive `brag add` requires at least --title, --type, and --impact. " +
        "For multiple impacts, use the interactive prompts instead.",
    );
  }
  const metric = opts.impactMetric ? parseImpactMetric(opts.impactMetric) : null;
  const metrics: ImpactMetric[] = metric ? [metric] : [];

  return {
    title: opts.title,
    date: opts.date ?? today(),
    type: opts.type as BragType,
    role: (opts.role as ContributionRole | undefined) ?? null,
    description: opts.description ?? "",
    impacts: [{ statement: opts.impact, metrics }],
    collaborators: opts.collaborators
      ? opts.collaborators
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [],
    link: opts.link ?? null,
  };
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Add a brag entry")
    .option("--date <date>", "date (YYYY-MM-DD)")
    .option("--role <role>", "your contribution role")
    .option("--type <type>", "brag category")
    .option("--title <title>", "short title")
    .option("--description <text>", "longer description")
    .option("--impact <text>", "free-text impact statement")
    .option("--impact-metric <text>", 'a number backing the impact, e.g. "40% faster"')
    .option("--collaborators <names>", "comma-separated collaborator names")
    .option("--link <url>", "link to additional context")
    .option("--enhance", "run the raw description through AI enhancement first", false)
    .option("--provider <provider>", "claude, openai, ollama, or claude-cli (with --enhance)")
    .option("--dry-run", "print the entry without writing it", false)
    .action(async (opts: AddOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { config, docPath } = await resolveConfig(globals);

      if (opts.enhance && opts.title) {
        throw new ValidationError("--enhance only applies to the interactive flow, not --title.");
      }

      let enhanceWith: { providerName: AiProviderName; config: BragConfig } | null = null;
      if (opts.enhance) {
        const providerName = resolveProviderName(opts.provider, config);
        assertProviderReady(providerName, config);
        enhanceWith = { providerName, config };
      }
      const fields = opts.title
        ? collectFromFlags(opts)
        : await collectInteractively(enhanceWith);
      const id = generateEntryId(fields.date, fields.title);
      const entry = BragEntrySchema.parse({ id, ...fields });

      if (opts.dryRun) {
        console.log(JSON.stringify(entry, null, 2));
        return;
      }

      const doc = await loadDoc(docPath);
      const target = OUTSIDE_WORK_TYPE_SET.has(entry.type) ? doc.outsideWork : doc.entries;
      target.push(entry);
      doc.meta.lastUpdated = today();

      await writeFileAtomic(docPath, serializeBragDoc(doc));

      if (!globals.quiet) {
        console.log(pc.green(`Added "${entry.title}" to ${docPath}`));
      }
    });
}
