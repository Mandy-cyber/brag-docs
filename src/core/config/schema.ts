import { z } from "zod";
import { OUTSIDE_WORK_TYPES, BragTypeSchema } from "../brag-doc/schema.js";
import { SECTION_KEYS } from "../brag-doc/constants.js";

const SectionKeySchema = z.enum(SECTION_KEYS);

const SectionsConfigSchema = z.object({
  order: z.array(SectionKeySchema).min(1),
  include: z.record(SectionKeySchema, z.boolean()),
});

const RenderConfigSchema = z.object({
  formats: z.array(z.enum(["markdown", "pdf"])).min(1),
  pdf: z.object({
    /** Optional path to a custom CSS file; null uses the tool's built-in default styling. */
    stylesheet: z.string().min(1).nullable(),
    pageFormat: z.enum(["Letter", "A4"]),
  }),
});

const AiProviderConfigSchema = z.object({
  claude: z.object({
    model: z.string().min(1),
    apiKeyEnvVar: z.string().min(1),
  }),
  openai: z.object({
    model: z.string().min(1),
    apiKeyEnvVar: z.string().min(1),
  }),
  ollama: z.object({
    model: z.string().min(1),
    host: z.url(),
  }),
  claudeCli: z.object({
    /** Defaults to "claude"; CLAUDE_CODE_EXECPATH overrides at runtime when unset by the user. */
    binary: z.string().min(1),
    /** Model alias/id for --model; null lets the local Claude Code session pick its own default. */
    model: z.string().min(1).nullable(),
  }),
  defaultProvider: z.enum(["claude", "openai", "ollama", "claude-cli"]),
});

const GitConfigSchema = z.object({
  authorEmails: z.array(z.email()),
});

export const BragConfigSchema = z.object({
  docPath: z.string().min(1),
  outputDir: z.string().min(1),
  sections: SectionsConfigSchema,
  outsideWorkTypes: z.array(BragTypeSchema).min(1),
  render: RenderConfigSchema,
  ai: AiProviderConfigSchema,
  git: GitConfigSchema,
});

export type BragConfig = z.infer<typeof BragConfigSchema>;

/** Default config written by `brag init`; also used to fill gaps in a loaded config. */
export const DEFAULT_CONFIG: BragConfig = {
  docPath: "./brag.md",
  outputDir: "./output",
  sections: {
    order: ["executiveSummary", "summaryByType", "entries", "learned", "feedback", "outsideWork"],
    include: {
      executiveSummary: true,
      summaryByType: false,
      entries: true,
      learned: true,
      feedback: true,
      outsideWork: true,
    },
  },
  outsideWorkTypes: [...OUTSIDE_WORK_TYPES],
  render: {
    formats: ["markdown", "pdf"],
    pdf: {
      stylesheet: null,
      pageFormat: "Letter",
    },
  },
  ai: {
    defaultProvider: "claude",
    claude: { model: "claude-sonnet-5", apiKeyEnvVar: "ANTHROPIC_API_KEY" },
    openai: { model: "gpt-5.6-terra", apiKeyEnvVar: "OPENAI_API_KEY" },
    ollama: { model: "llama3.1", host: "http://127.0.0.1:11434" },
    claudeCli: { binary: "claude", model: null },
  },
  git: {
    authorEmails: [],
  },
};
