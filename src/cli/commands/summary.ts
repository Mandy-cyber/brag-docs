import type { Command } from "commander";
import pc from "picocolors";
import { buildEntriesDigest } from "../../core/brag-doc/sections.js";
import { serializeBragDoc } from "../../core/brag-doc/serializer.js";
import { writeFileAtomic } from "../../core/utils/fs.js";
import { ValidationError } from "../../core/errors.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";
import { generateExecutiveSummary, resolveProviderName } from "../ai.js";
import { promptConfirm } from "../prompts.js";

interface SummaryGenerateOptions {
  provider?: string;
}

export function registerSummaryCommand(program: Command): void {
  const summary = program.command("summary").description("Manage the executive summary");

  summary
    .command("generate")
    .description("Regenerate the Executive Summary from current entries via AI")
    .option("--provider <provider>", "claude, openai, ollama, or claude-cli")
    .action(async (opts: SummaryGenerateOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { config, docPath } = await resolveConfig(globals);
      const doc = await loadDoc(docPath);

      const digest = buildEntriesDigest(doc);
      if (digest.length === 0) {
        throw new ValidationError("No entries to summarize yet — add some with `brag add` first.");
      }

      const providerName = resolveProviderName(opts.provider, config);
      console.log(pc.dim(`Generating summary with ${providerName}...`));
      const result = await generateExecutiveSummary(digest, providerName, config);

      console.log(`\n${pc.bold("Current summary:")}\n${doc.executiveSummary || "(none)"}\n`);
      console.log(`${pc.bold("Suggested summary:")}\n${result.summary}\n`);

      const apply = await promptConfirm({ message: "Apply this summary?", initialValue: false });
      if (!apply) {
        console.log(pc.dim("Left unchanged."));
        return;
      }

      doc.executiveSummary = result.summary;
      await writeFileAtomic(docPath, serializeBragDoc(doc));
      console.log(pc.green(`Updated the Executive Summary in ${docPath}`));
    });
}
