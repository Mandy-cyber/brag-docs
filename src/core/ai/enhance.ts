import { z, type ZodError, type ZodType } from "zod";
import { AiValidationError } from "../errors.js";
import type { AiProvider, ContextPack } from "./types.js";

function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`)
    .join("; ");
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
