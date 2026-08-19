import type { BragDoc } from "./types.js";
import type { BragEntry, FeedbackEntry, LearnedEntry } from "./schema.js";
import {
  BRAG_ENTRY_FENCE_META,
  DOC_META_FENCE_META,
  FEEDBACK_ENTRY_FENCE_META,
  LEARNED_ENTRY_FENCE_META,
  SECTION_HEADINGS,
} from "./constants.js";

/** Renders a value as a fenced ```json block with the given fence meta tag. */
function fence(meta: string, value: unknown): string {
  return "```json " + meta + "\n" + JSON.stringify(value, null, 2) + "\n```";
}

/** Explicit key order keeps JSON.stringify output byte-stable across serializations. */
function bragEntryPayload(entry: BragEntry): object {
  const { id, date, role, type, impacts, collaborators, link } = entry;
  return { id, date, role, type, impacts, collaborators, link };
}

function feedbackEntryPayload(entry: FeedbackEntry): object {
  const { id, date, sentiment, source, content, howAddressed, link } = entry;
  return { id, date, sentiment, source, content, howAddressed, link };
}

function learnedEntryPayload(entry: LearnedEntry): object {
  const { id, date, category, link } = entry;
  return { id, date, category, link };
}

function serializeEntryLike(
  fenceMeta: string,
  title: string,
  payload: object,
  description: string,
): string {
  const parts = [`### ${title}`, fence(fenceMeta, payload)];
  if (description.length > 0) {
    parts.push(description);
  }
  return parts.join("\n\n");
}

function serializeEntry(entry: BragEntry): string {
  return serializeEntryLike(
    BRAG_ENTRY_FENCE_META,
    entry.title,
    bragEntryPayload(entry),
    entry.description,
  );
}

function serializeFeedbackEntry(entry: FeedbackEntry): string {
  return serializeEntryLike(
    FEEDBACK_ENTRY_FENCE_META,
    entry.title,
    feedbackEntryPayload(entry),
    "",
  );
}

function serializeLearnedEntry(entry: LearnedEntry): string {
  return serializeEntryLike(
    LEARNED_ENTRY_FENCE_META,
    entry.title,
    learnedEntryPayload(entry),
    entry.description,
  );
}

/** Serializes a BragDoc back to canonical brag.md text. Always includes every section. */
export function serializeBragDoc(doc: BragDoc): string {
  const sections: string[] = [
    `# ${doc.title}`,
    fence(DOC_META_FENCE_META, doc.meta),
    `## ${SECTION_HEADINGS.executiveSummary}\n\n${doc.executiveSummary}`.trim(),
  ];

  const entryBlocks = doc.entries.map(serializeEntry).join("\n\n");
  sections.push(`## ${SECTION_HEADINGS.entries}\n\n${entryBlocks}`.trim());

  const learnedBlocks = doc.learned.map(serializeLearnedEntry).join("\n\n");
  sections.push(`## ${SECTION_HEADINGS.learned}\n\n${learnedBlocks}`.trim());

  const feedbackBlocks = doc.feedback.map(serializeFeedbackEntry).join("\n\n");
  sections.push(`## ${SECTION_HEADINGS.feedback}\n\n${feedbackBlocks}`.trim());

  const outsideWorkBlocks = doc.outsideWork.map(serializeEntry).join("\n\n");
  sections.push(`## ${SECTION_HEADINGS.outsideWork}\n\n${outsideWorkBlocks}`.trim());

  return sections.join("\n\n") + "\n";
}
