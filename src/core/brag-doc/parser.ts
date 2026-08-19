import { unified } from "unified";
import remarkParse from "remark-parse";
import type { ZodType } from "zod";
import type { Heading, Root, RootContent } from "mdast";
import { ParseError } from "../errors.js";
import { validateOrThrow } from "./validator.js";
import {
  BragEntrySchema,
  DocMetaSchema,
  FeedbackEntrySchema,
  LearnedEntrySchema,
} from "./schema.js";
import type { BragDoc } from "./types.js";
import {
  BRAG_ENTRY_FENCE_META,
  DOC_META_FENCE_META,
  FEEDBACK_ENTRY_FENCE_META,
  HEADING_TO_SECTION,
  LEARNED_ENTRY_FENCE_META,
  SECTION_HEADINGS,
} from "./constants.js";
import { findFencedJson, headingText, renderNodes, splitByHeadingDepth } from "./ast.js";

/** Parses fenced-block JSON, wrapping native parse failures as a ParseError with context. */
function parseFencedJson(code: { value: string }, context: string): unknown {
  try {
    return JSON.parse(code.value);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ParseError(`${context}: invalid JSON in fenced block (${message})`);
  }
}

/**
 * Parses one "### heading" entry (either a brag-entry or a
 * feedback-entry) from its sibling nodes: locates the fenced JSON
 * block, validates it, and captures the remaining prose as the
 * entry's description/content.
 */
function parseEntryLike<T>(
  heading: Heading,
  content: RootContent[],
  fenceMeta: string,
  schema: ZodType<T>,
  sectionLabel: string,
): T {
  const title = headingText(heading);
  const line = heading.position?.start.line ?? "?";
  const context = `${sectionLabel} entry "${title}" (line ${line})`;

  const code = findFencedJson(content, fenceMeta);
  if (!code) {
    throw new ParseError(`${context}: missing a fenced \`\`\`json ${fenceMeta} block`);
  }

  const raw = parseFencedJson(code, context);
  const rest = content.filter((node) => node !== code);
  const description = renderNodes(rest);

  // Heading text and trailing prose are the source of truth for
  // title/description — they win over any same-named key a user
  // may have (incorrectly) placed inside the JSON block.
  const withDerived =
    typeof raw === "object" && raw !== null ? { ...raw, title, description } : raw;

  return validateOrThrow(schema, withDerived, context);
}

/**
 * Parses brag.md source text into a validated, structured BragDoc.
 * Throws ParseError/ValidationError.
 */
export function parseBragDoc(source: string): BragDoc {
  const root = unified().use(remarkParse).parse(source) as Root;
  const nodes = root.children;

  const titleHeading = nodes.find(
    (node): node is Heading => node.type === "heading" && node.depth === 1,
  );
  if (!titleHeading) {
    throw new ParseError("brag.md must start with a level-1 heading (document title)");
  }
  const title = headingText(titleHeading);

  const metaCode = findFencedJson(nodes, DOC_META_FENCE_META);
  if (!metaCode) {
    throw new ParseError(`brag.md is missing a fenced \`\`\`json ${DOC_META_FENCE_META} block`);
  }
  const meta = validateOrThrow(
    DocMetaSchema,
    parseFencedJson(metaCode, "doc-meta"),
    "doc-meta",
  );

  const sections = splitByHeadingDepth(nodes, 2);
  const seenHeadings = new Set<string>();
  const doc: BragDoc = {
    meta,
    title,
    executiveSummary: "",
    entries: [],
    learned: [],
    feedback: [],
    outsideWork: [],
  };
  const seenIds = new Set<string>();

  for (const { heading, content } of sections) {
    const text = headingText(heading);
    const key = HEADING_TO_SECTION[text];
    if (!key) {
      const known = Object.values(SECTION_HEADINGS).join(", ");
      throw new ParseError(
        `brag.md: unrecognized section heading "${text}" (line ` +
          `${heading.position?.start.line ?? "?"}) — expected one of: ${known}`,
      );
    }
    if (seenHeadings.has(key)) {
      throw new ParseError(`brag.md: duplicate "${text}" section`);
    }
    seenHeadings.add(key);

    switch (key) {
      case "executiveSummary":
        doc.executiveSummary = renderNodes(content);
        break;

      case "learned":
        for (const segment of splitByHeadingDepth(content, 3)) {
          const entry = parseEntryLike(
            segment.heading,
            segment.content,
            LEARNED_ENTRY_FENCE_META,
            LearnedEntrySchema,
            "Learned",
          );
          if (seenIds.has(entry.id)) {
            throw new ParseError(`brag.md: duplicate entry id "${entry.id}"`);
          }
          seenIds.add(entry.id);
          doc.learned.push(entry);
        }
        break;

      case "entries":
      case "outsideWork":
        for (const segment of splitByHeadingDepth(content, 3)) {
          const entry = parseEntryLike(
            segment.heading,
            segment.content,
            BRAG_ENTRY_FENCE_META,
            BragEntrySchema,
            "Entries",
          );
          if (seenIds.has(entry.id)) {
            throw new ParseError(`brag.md: duplicate entry id "${entry.id}"`);
          }
          seenIds.add(entry.id);
          doc[key].push(entry);
        }
        break;

      case "feedback":
        for (const segment of splitByHeadingDepth(content, 3)) {
          const entry = parseEntryLike(
            segment.heading,
            segment.content,
            FEEDBACK_ENTRY_FENCE_META,
            FeedbackEntrySchema,
            "Feedback",
          );
          if (seenIds.has(entry.id)) {
            throw new ParseError(`brag.md: duplicate entry id "${entry.id}"`);
          }
          seenIds.add(entry.id);
          doc.feedback.push(entry);
        }
        break;
    }
  }

  return doc;
}
