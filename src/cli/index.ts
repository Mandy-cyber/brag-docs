import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerAddCommand } from "./commands/add.js";
import { registerFeedbackCommand } from "./commands/feedback.js";
import { registerLearnedCommand } from "./commands/learned.js";
import { registerEnhanceCommand } from "./commands/enhance.js";
import { registerSummaryCommand } from "./commands/summary.js";
import { registerValidateCommand } from "./commands/validate.js";
import { registerBuildCommand } from "./commands/build.js";
import { registerConfigCommand } from "./commands/config.js";
import { reportError } from "./formatting.js";

const program = new Command();

program
  .name("brag")
  .description("Maintain a running brag document of professional accomplishments.")
  .version("0.1.0")
  .option("--config <path>", "path to brag.config.json")
  .option("--doc <path>", "override the configured docPath")
  .option("--json", "machine-readable output where supported")
  .option("--quiet", "suppress non-essential output");

registerInitCommand(program);
registerAddCommand(program);
registerFeedbackCommand(program);
registerLearnedCommand(program);
registerEnhanceCommand(program);
registerSummaryCommand(program);
registerValidateCommand(program);
registerBuildCommand(program);
registerConfigCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  process.exitCode = reportError(error);
});
