import * as clack from "@clack/prompts";
import type { Option } from "@clack/prompts";

/** Thrown when the user cancels an interactive prompt (Ctrl-C / Esc). */
export class PromptCancelledError extends Error {
  constructor() {
    super("Cancelled.");
    this.name = "PromptCancelledError";
  }
}

function unwrap<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel("Cancelled.");
    throw new PromptCancelledError();
  }
  return value;
}

export async function promptText(options: {
  message: string;
  placeholder?: string;
  defaultValue?: string;
}): Promise<string> {
  return unwrap(await clack.text(options));
}

export async function promptSelect<Value extends string>(options: {
  message: string;
  options: Option<Value>[];
}): Promise<Value> {
  return unwrap(await clack.select(options));
}

export async function promptConfirm(options: {
  message: string;
  initialValue?: boolean;
}): Promise<boolean> {
  return unwrap(await clack.confirm(options));
}
