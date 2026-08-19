/** Section identifiers in default render order; matches `brag.config.json`'s `sections.order`. */
export const SECTION_KEYS = [
  "executiveSummary",
  "summaryByType",
  "entries",
  "learned",
  "feedback",
  "outsideWork",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Sections actually stored in brag.md; "summaryByType" is a derived, render-only view. */
export type StoredSectionKey = Exclude<SectionKey, "summaryByType">;

/** Depth-2 heading text per stored section. */
export const SECTION_HEADINGS: Record<StoredSectionKey, string> = {
  executiveSummary: "Executive Summary",
  entries: "Entries",
  learned: "What I've Learned",
  feedback: "Feedback",
  outsideWork: "Things I've Done Outside Work",
};

/** Reverse lookup: heading text -> section key. */
export const HEADING_TO_SECTION: Record<string, StoredSectionKey> = Object.fromEntries(
  Object.entries(SECTION_HEADINGS).map(([key, heading]) => [heading, key as StoredSectionKey]),
);

export const DOC_META_FENCE_META = "doc-meta";
export const BRAG_ENTRY_FENCE_META = "brag-entry";
export const FEEDBACK_ENTRY_FENCE_META = "feedback-entry";
export const LEARNED_ENTRY_FENCE_META = "learned-entry";
