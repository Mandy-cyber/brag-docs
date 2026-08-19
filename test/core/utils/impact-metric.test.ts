import { describe, expect, it } from "vitest";
import { parseImpactMetric } from "../../../src/core/utils/impact-metric.js";

describe("parseImpactMetric", () => {
  it("parses a percentage", () => {
    expect(parseImpactMetric("40% faster")).toEqual({ value: 40, unit: "% faster" });
  });

  it("parses a comma-separated dollar figure", () => {
    expect(parseImpactMetric("$50,000 saved annually")).toEqual({
      value: 50000,
      unit: "$ saved annually",
    });
  });

  it("parses a number embedded mid-sentence", () => {
    expect(parseImpactMetric("saved the team 3 hours per week")).toEqual({
      value: 3,
      unit: "saved the team hours per week",
    });
  });

  it("returns null when there's no number", () => {
    expect(parseImpactMetric("much faster")).toBeNull();
  });

  it("returns null when there's nothing left for a unit", () => {
    expect(parseImpactMetric("40")).toBeNull();
  });
});
