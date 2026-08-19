import { z } from "zod";

/**
 * Categories a brag entry can belong to. "other" is a deliberate
 * escape hatch for anything unanticipated.
 */
export const BRAG_TYPES = [
  "project",
  "bug-catch",
  "mentorship",
  "volunteering",
  "design-doc",
  "blog-post",
  "talk",
  "certification",
  "conference",
  "continued-ed",
  "hackathon",
  "open-source",
  "code-quality",
  "other",
] as const;

export const BragTypeSchema = z.enum(BRAG_TYPES);

/**
 * Brag types that route an entry into the "Things I've Done Outside
 * Work" section rather than "Entries".
 */
export const OUTSIDE_WORK_TYPES = [
  "talk",
  "blog-post",
  "open-source",
  "certification",
  "conference",
  "continued-ed",
  "hackathon",
] as const;

/**
 * The part you played in a piece of work — distinct from job title,
 * which belongs in `description`/`impact` prose if relevant.
 */
export const CONTRIBUTION_ROLES = [
  "solo",
  "lead",
  "contributor",
  "idea-originator",
  "reviewer",
  "mentor",
  "other",
] as const;

export const ContributionRoleSchema = z.enum(CONTRIBUTION_ROLES);

/** A single numeric figure backing an impact statement, e.g. `{ value: 40, unit: "% faster" }`. */
export const ImpactMetricSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
});

/**
 * One impact of a brag entry: a required free-text statement —
 * qualitative or quantitative — plus zero or more clean numbers
 * backing it, purely to drive the impact-sorted summary view.
 * An impact with no metrics still carries its full statement.
 */
export const ImpactSchema = z.object({
  statement: z.string().min(1),
  metrics: z.array(ImpactMetricSchema),
});

/**
 * A single brag entry. `impacts` holds one or more distinct
 * impacts — a piece of work can matter in more than one way (e.g.
 * a latency reduction and a team-morale improvement).
 */
export const BragEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  role: ContributionRoleSchema.nullable(),
  type: BragTypeSchema,
  impacts: z.array(ImpactSchema).min(1),
  collaborators: z.array(z.string().min(1)),
  link: z.url({ protocol: /^https?$/ }).nullable(),
  description: z.string(),
});

/**
 * Feedback received (positive or constructive). `howAddressed` is
 * nullable regardless of sentiment — recommended (and prompted for)
 * on constructive feedback, but not schema-enforced, since a piece
 * of constructive feedback may genuinely be unaddressed yet.
 */
export const FeedbackEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  sentiment: z.enum(["positive", "constructive"]),
  source: z.string().min(1).nullable(),
  content: z.string().min(1),
  howAddressed: z
    .string()
    .min(1)
    .nullable()
    .describe("Recommended for constructive feedback; not required."),
  link: z.url({ protocol: /^https?$/ }).nullable(),
});

/** Categories for a "what I've learned" entry. */
export const LEARNED_CATEGORIES = ["library", "tool", "technique", "other"] as const;

export const LearnedCategorySchema = z.enum(LEARNED_CATEGORIES);

/** A single "what I've learned" entry — a library, tool, or technique picked up along the way. */
export const LearnedEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  category: LearnedCategorySchema,
  link: z.url({ protocol: /^https?$/ }).nullable(),
  description: z.string(),
});

/** Doc-level metadata carried in the `doc-meta` fenced JSON block at the top of brag.md. */
export const DocMetaSchema = z.object({
  schemaVersion: z.number().int().positive(),
  lastUpdated: z.iso.date(),
  generatedBy: z.string().min(1),
});

export type BragType = z.infer<typeof BragTypeSchema>;
export type ContributionRole = z.infer<typeof ContributionRoleSchema>;
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
export type BragEntry = z.infer<typeof BragEntrySchema>;
export type FeedbackEntry = z.infer<typeof FeedbackEntrySchema>;
export type LearnedCategory = z.infer<typeof LearnedCategorySchema>;
export type LearnedEntry = z.infer<typeof LearnedEntrySchema>;
export type DocMeta = z.infer<typeof DocMetaSchema>;
