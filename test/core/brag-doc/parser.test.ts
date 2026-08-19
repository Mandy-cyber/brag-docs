import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseBragDoc } from "../../../src/core/brag-doc/parser.js";
import { serializeBragDoc } from "../../../src/core/brag-doc/serializer.js";
import { ParseError, ValidationError } from "../../../src/core/errors.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, "..", "..", "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf8");
}

describe("parseBragDoc", () => {
  it("parses a valid brag.md into a structured BragDoc", () => {
    const doc = parseBragDoc(readFixture("valid-brag.md"));

    expect(doc.title).toBe("Alex Rivera");
    expect(doc.meta.schemaVersion).toBe(1);
    expect(doc.entries).toHaveLength(2);
    expect(doc.entries[0]?.id).toBe("2026-03-14-caching-layer");
    expect(doc.entries[0]?.impacts).toHaveLength(2);
    expect(doc.entries[0]?.impacts[0]?.metrics).toEqual([{ value: 40, unit: "% faster" }]);
    expect(doc.entries[1]?.impacts).toHaveLength(1);
    expect(doc.entries[1]?.impacts[0]?.metrics).toEqual([]);
    expect(doc.learned).toHaveLength(2);
    expect(doc.learned[0]?.category).toBe("tool");
    expect(doc.learned[0]?.title).toBe("OpenTelemetry for distributed tracing");
    expect(doc.feedback).toHaveLength(1);
    expect(doc.feedback[0]?.howAddressed).not.toBeNull();
    expect(doc.outsideWork).toHaveLength(1);
    expect(doc.outsideWork[0]?.type).toBe("talk");
  });

  it("round-trips: parse(serialize(parse(doc))) === parse(doc)", () => {
    const original = parseBragDoc(readFixture("valid-brag.md"));
    const reparsed = parseBragDoc(serializeBragDoc(original));
    expect(reparsed).toEqual(original);
  });

  it("is stable under a second round-trip", () => {
    const once = serializeBragDoc(parseBragDoc(readFixture("valid-brag.md")));
    const twice = serializeBragDoc(parseBragDoc(once));
    expect(twice).toBe(once);
  });

  it("rejects a doc missing the doc-meta block", () => {
    const source = "# Title\n\n## Executive Summary\n\nHi.\n";
    expect(() => parseBragDoc(source)).toThrow(ParseError);
  });

  it("rejects an unrecognized section heading", () => {
    const source = readFixture("valid-brag.md").replace(
      "## Executive Summary",
      "## Goals For Next Quarter",
    );
    expect(() => parseBragDoc(source)).toThrow(ParseError);
  });

  it("rejects an entry with an invalid type", () => {
    const source = readFixture("valid-brag.md").replace('"type": "project"', '"type": "bogus"');
    expect(() => parseBragDoc(source)).toThrow(ValidationError);
  });

  it("rejects duplicate entry ids", () => {
    const source = readFixture("valid-brag.md").replace(
      "2025-11-01-mentorship",
      "2026-03-14-caching-layer",
    );
    expect(() => parseBragDoc(source)).toThrow(ParseError);
  });
});
