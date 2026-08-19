import pc from "picocolors";
import { BragError } from "../core/errors.js";
import { PromptCancelledError } from "./prompts.js";

/**
 * Prints a caught error and returns the process exit code to use.
 * BragError subclasses ("your data") print a clean message; anything
 * else ("our bug") prints a stack trace with a please-file-an-issue
 * note, since it means the tool hit a case it didn't anticipate.
 * A cancelled prompt is neither — clack already printed its own
 * message, so this just exits quietly.
 */
export function reportError(error: unknown): number {
  if (error instanceof PromptCancelledError) {
    return 1;
  }
  if (error instanceof BragError) {
    console.error(pc.red(`${error.name}: ${error.message}`));
    return 1;
  }
  console.error(pc.red("Unexpected error:"));
  console.error(error);
  console.error(pc.dim("This looks like a bug in brag-docs — please file an issue."));
  return 2;
}
