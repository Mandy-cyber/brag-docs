import type { BragEntry, FeedbackEntry, LearnedEntry, DocMeta } from "./schema.js";

export type {
  BragType,
  ContributionRole,
  BragEntry,
  FeedbackEntry,
  LearnedCategory,
  LearnedEntry,
  DocMeta,
} from "./schema.js";

/** The fully parsed, structured representation of a brag.md file. */
export interface BragDoc {
  meta: DocMeta;
  title: string;
  executiveSummary: string;
  entries: BragEntry[];
  learned: LearnedEntry[];
  feedback: FeedbackEntry[];
  outsideWork: BragEntry[];
}
