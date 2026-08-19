import { promises as fs } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import pc from "picocolors";
import { markdownRenderer } from "../../core/render/markdown.js";
import { pdfRenderer } from "../../core/render/pdf.js";
import { docxRenderer } from "../../core/render/docx.js";
import type { Renderer } from "../../core/render/types.js";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";

interface BuildOptions {
  format?: string[];
  out?: string;
}

const RENDERERS: Record<string, Renderer> = {
  markdown: markdownRenderer,
  pdf: pdfRenderer,
  docx: docxRenderer,
};

const EXTENSIONS: Record<string, string> = { markdown: "md", pdf: "pdf", docx: "docx" };

function collectFormat(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function registerBuildCommand(program: Command): void {
  program
    .command("build")
    .description("Render brag.md to the configured output formats")
    .option(
      "--format <format>",
      "restrict to one format (repeatable)",
      collectFormat,
      [] as string[],
    )
    .option("--out <dir>", "override the configured output directory")
    .action(async (opts: BuildOptions, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { config, docPath } = await resolveConfig(globals);
      const doc = await loadDoc(docPath);

      const formats = opts.format && opts.format.length > 0 ? opts.format : config.render.formats;
      const outputDir = path.resolve(opts.out ?? config.outputDir);
      await fs.mkdir(outputDir, { recursive: true });

      for (const format of formats) {
        const renderer = RENDERERS[format];
        if (!renderer) {
          throw new Error(`Unknown format "${format}" (this is a bug — validate should catch it)`);
        }
        const output = await renderer.render(doc, config);
        const outPath = path.join(outputDir, `brag.${EXTENSIONS[format] ?? format}`);
        await fs.writeFile(outPath, output);
        if (!globals.quiet) {
          console.log(pc.green(`Wrote ${outPath}`));
        }
      }
    });
}
