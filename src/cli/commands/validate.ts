import type { Command } from "commander";
import pc from "picocolors";
import { getGlobalOptions, loadDoc, resolveConfig } from "../context.js";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Parse and validate brag.md with no side effects")
    .action(async (_opts: unknown, cmd: Command) => {
      const globals = getGlobalOptions(cmd);
      const { docPath } = await resolveConfig(globals);
      const doc = await loadDoc(docPath);

      const summary = {
        ok: true,
        docPath,
        entries: doc.entries.length,
        outsideWork: doc.outsideWork.length,
        learned: doc.learned.length,
        feedback: doc.feedback.length,
      };

      if (globals.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log(pc.green(`${docPath} is valid.`));
        console.log(
          `  ${summary.entries} entries, ${summary.outsideWork} outside-work, ` +
            `${summary.learned} learned, ${summary.feedback} feedback`,
        );
      }
    });
}
