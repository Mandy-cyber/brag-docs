import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { enhance } from "../../../src/core/ai/enhance.js";
import { AiValidationError } from "../../../src/core/errors.js";
import type { AiProvider, ContextPack } from "../../../src/core/ai/types.js";

const schema = z.object({ title: z.string().min(1) });
const contextPack: ContextPack = { systemPrompt: "test", fewShotExamples: [] };

function providerReturning(...results: unknown[]): AiProvider {
  const complete = vi.fn();
  for (const result of results) {
    complete.mockImplementationOnce(async () => result);
  }
  return { name: "mock", complete };
}

describe("enhance", () => {
  it("returns the validated result on the first successful attempt", async () => {
    const provider = providerReturning({ title: "Shipped the thing" });
    const result = await enhance(provider, "raw input", schema, contextPack);
    expect(result).toEqual({ title: "Shipped the thing" });
    expect(provider.complete).toHaveBeenCalledTimes(1);
  });

  it("retries once after an invalid response, then succeeds", async () => {
    const provider = providerReturning({ title: "" }, { title: "Fixed on retry" });
    const result = await enhance(provider, "raw input", schema, contextPack);
    expect(result).toEqual({ title: "Fixed on retry" });
    expect(provider.complete).toHaveBeenCalledTimes(2);
    // The retry call includes the raw input plus the validation issue.
    const mockComplete = provider.complete as ReturnType<typeof vi.fn>;
    const secondCallInput = mockComplete.mock.calls[1]![0] as string;
    expect(secondCallInput).toContain("raw input");
    expect(secondCallInput).toContain("failed validation");
  });

  it("throws AiValidationError when both attempts produce invalid output", async () => {
    const provider = providerReturning({ title: "" }, { title: "" });
    await expect(enhance(provider, "raw input", schema, contextPack)).rejects.toThrow(
      AiValidationError,
    );
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("rejects and retries when a field is a serialized JSON blob instead of plain text", async () => {
    const corrupted = { title: '{"title":"x","description":"y","impacts":[]}' };
    const provider = providerReturning(corrupted, { title: "Clean title on retry" });
    const result = await enhance(provider, "raw input", schema, contextPack);
    expect(result).toEqual({ title: "Clean title on retry" });
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("treats a provider throwing (e.g. a refusal) the same as invalid output", async () => {
    const complete = vi.fn().mockRejectedValue(new Error("Claude declined to respond."));
    const provider: AiProvider = { name: "mock", complete };
    await expect(enhance(provider, "raw input", schema, contextPack)).rejects.toThrow(
      AiValidationError,
    );
    expect(complete).toHaveBeenCalledTimes(2);
  });
});
