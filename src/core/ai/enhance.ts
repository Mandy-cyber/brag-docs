import { z, type ZodError, type ZodType } from "zod";
import { AiValidationError } from "../errors.js";
import type { AiProvider, ContextPack } from "./types.js";

function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`)
    .join("; ");
}

function looksLikeSerializedJson(value: string): boolean {
  const trimmed = value.trim();
  const bracketed =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  if (!bracketed) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively scans a validated response for a string field that is
 * itself a serialized JSON object/array. Zod's `.min(1)` string
 * checks pass this through fine, but it's a real observed model
 * failure mode: the whole structured response gets stringified into
 * one field instead of being returned as that field's plain-text
 * value. Returns the dotted path of the first offending field, or
 * null if the response looks clean.
 */
function findSerializedJsonField(value: unknown, path = ""): string | null {
  if (typeof value === "string") {
    return looksLikeSerializedJson(value) ? path || "(root)" : null;
  }
  if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) {
      const found = findSerializedJsonField(item, `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const found = findSerializedJsonField(item, path ? `${path}.${key}` : key);
      if (found) return found;
    }
    return null;
  }
  return null;
}

/**
 * Calls `provider` with `rawInput`, validates the response against
 * `schema`, and retries once (with the validation issue fed back to
 * the model) on failure. Throws AiValidationError if both attempts
 * fail — an entry is never silently written with corrupted AI output.
 */
export async function enhance<T>(
  provider: AiProvider,
  rawInput: string,
  schema: ZodType<T>,
  contextPack: ContextPack,
): Promise<T> {
  // Some providers' validators reject the `$schema` meta field zod emits by default.
  const { $schema: _unused, ...jsonSchema } = z.toJSONSchema(schema);

  const attempt = async (input: string): Promise<T> => {
    const raw = await provider.complete(input, jsonSchema, contextPack);
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new Error(formatIssues(result.error));
    }
    const suspiciousField = findSerializedJsonField(result.data);
    if (suspiciousField) {
      throw new Error(
        `Field "${suspiciousField}" looks like a serialized JSON object instead of plain ` +
          "text — the model likely wrapped its whole response into one field.",
      );
    }
    return result.data;
  };

  try {
    return await attempt(rawInput);
  } catch (firstError) {
    const issue = firstError instanceof Error ? firstError.message : String(firstError);
    try {
      return await attempt(
        `${rawInput}\n\n(Your previous response failed validation: ${issue}. ` +
          `Try again, matching the required schema exactly.)`,
      );
    } catch (secondError) {
      const message = secondError instanceof Error ? secondError.message : String(secondError);
      throw new AiValidationError(
        `AI provider "${provider.name}" produced invalid output after one retry: ${message}`,
      );
    }
  }
}
