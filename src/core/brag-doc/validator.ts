import type { ZodType, ZodError } from "zod";
import { ValidationError } from "../errors.js";

/**
 * Formats a zod error's issues as "path: message" lines, joined for
 * a single ValidationError.
 */
function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

/**
 * Validates `data` against `schema`, prefixing failures with
 * `context` (e.g. an entry's heading text) so the CLI can point the
 * user at the offending entry.
 */
export function validateOrThrow<T>(schema: ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(`${context}: ${formatIssues(result.error)}`);
  }
  return result.data;
}
