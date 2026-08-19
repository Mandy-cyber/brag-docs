import type { BragDoc } from "../brag-doc/types.js";
import type { BragEntry, Impact, LearnedEntry, FeedbackEntry } from "../brag-doc/schema.js";
import type { BragConfig } from "../config/schema.js";
import { groupByType, sortByImpactThenDate } from "../brag-doc/sections.js";
import { SECTION_HEADINGS } from "../brag-doc/constants.js";
import type { Renderer } from "./types.js";

/**
 * Neutralizes HTML metacharacters in free text before it's embedded
 * in rendered markdown. Entry content can originate from AI output
 * or git commit messages, and this markdown is later fed to a
 * markdown-to-HTML-to-PDF pipeline (see render/pdf.ts) — without
 * this, a literal `<script>` in a description would execute when
 * the PDF is generated.
 */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Display label for the "entries" section — independent of the canonical source-file heading. */
const ACCOMPLISHMENTS_TITLE = "Accomplishments";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleHeading(title: string, link: string | null): string {
  return link ? `[${title}](${link})` : title;
}

/** Same as titleHeading, but as raw HTML for use inside table cells (marked doesn't reprocess markdown inside raw HTML blocks). */
function titleCell(title: string, link: string | null): string {
  if (!link) return title;
  const href = esc(link).replace(/"/g, "&quot;");
  return `<a href="${href}">${title}</a>`;
}

function formatImpact(impact: Impact): string {
  if (impact.metrics.length === 0) return esc(impact.statement);
  const metrics = impact.metrics.map((m) => `${m.value} ${esc(m.unit)}`).join(", ");
  return `${esc(impact.statement)} (${metrics})`;
}

/** The impact with the single largest metric value, or the first impact if none have metrics. */
function topImpact(entry: BragEntry): Impact {
  let best: Impact | null = null;
  let bestValue = -Infinity;
  for (const impact of entry.impacts) {
    for (const metric of impact.metrics) {
      if (metric.value > bestValue) {
        bestValue = metric.value;
        best = impact;
      }
    }
  }
  return best ?? entry.impacts[0]!;
}

function formatBragEntry(entry: BragEntry): string {
  const lines = [`### ${titleHeading(esc(entry.title), entry.link)}`, ""];
  const meta: string[] = [`<strong>Date:</strong> ${entry.date}`];
  if (entry.role) meta.push(`<strong>Role:</strong> ${entry.role}`);
  if (entry.collaborators.length > 0) {
    meta.push(`<strong>Collaborators:</strong> ${entry.collaborators.map(esc).join(", ")}`);
  }
  lines.push(`<p class="entry-meta">${meta.join(" | ")}</p>`, "");
  if (entry.description.length > 0) {
    lines.push(esc(entry.description), "");
  }
  lines.push("**Impact:**");
  for (const impact of entry.impacts) {
    lines.push(`- ${formatImpact(impact)}`);
  }
  return lines.join("\n").trim();
}

function htmlTable(className: string, headers: string[], rows: string[][]): string {
  const headRow = headers.map((h) => `<th>${h}</th>`).join("");
  const bodyRows = rows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("\n");
  return (
    `<table class="${className}">\n<thead><tr>${headRow}</tr></thead>\n` +
    `<tbody>\n${bodyRows}\n</tbody>\n</table>`
  );
}

function renderLearnedSection(learned: LearnedEntry[]): string {
  if (learned.length === 0) return "";
  const rows = learned.map((entry) => [
    entry.date,
    titleCell(esc(entry.title), entry.link),
    esc(entry.category),
    entry.description.length > 0 ? esc(entry.description) : "",
  ]);
  return htmlTable("learned-table", ["Date", "Title", "Category", "Notes"], rows);
}

function formatFeedbackBullet(entry: FeedbackEntry): string {
  const lines = [`- ${esc(entry.content)}`];
  if (entry.howAddressed) {
    lines.push(`  - **How I addressed it:** ${esc(entry.howAddressed)}`);
  }
  return lines.join("\n");
}

function renderConstructiveFeedbackTable(entries: FeedbackEntry[]): string {
  const rows = entries.map((entry) => [
    esc(entry.content),
    entry.source ? esc(entry.source) : "",
    entry.howAddressed ? esc(entry.howAddressed) : "",
  ]);
  return htmlTable(
    "feedback-table",
    ["Feedback received", "Received by", "How it's been addressed"],
    rows,
  );
}

function renderFeedbackSection(feedback: FeedbackEntry[]): string {
  const parts: string[] = [];
  const positive = feedback.filter((entry) => entry.sentiment === "positive");
  if (positive.length > 0) {
    parts.push("### Positive");
    parts.push(positive.map(formatFeedbackBullet).join("\n"));
  }
  const constructive = feedback.filter((entry) => entry.sentiment === "constructive");
  if (constructive.length > 0) {
    parts.push("### Constructive");
    parts.push(renderConstructiveFeedbackTable(constructive));
  }
  return parts.join("\n\n").trim();
}

function renderSummaryByType(doc: BragDoc): string {
  const groups = groupByType([...doc.entries, ...doc.outsideWork]);
  const parts: string[] = [];
  for (const [type, entries] of groups) {
    parts.push(`### ${type}`, "");
    for (const entry of entries) {
      const title = titleHeading(esc(entry.title), entry.link);
      parts.push(`- **${title}** (${entry.date}) — ${formatImpact(topImpact(entry))}`);
    }
    parts.push("");
  }
  return parts.join("\n").trim();
}

interface RenderedSection {
  title: string;
  slug: string;
  body: string;
}

/**
 * Wraps `body` under an `<h2 id>` (a page-break anchor and TOC
 * target), or null if `body` is empty.
 */
function section(title: string, body: string): RenderedSection | null {
  if (body.trim().length === 0) return null;
  const slug = slugify(title);
  return { title, slug, body: `<h2 id="${slug}">${title}</h2>\n\n${body}` };
}

function buildTableOfContents(sections: RenderedSection[]): string {
  const items = sections
    .map((s) => `  <li><a href="#${s.slug}">${s.title}</a></li>`)
    .join("\n");
  return `<h2 class="toc-heading">Table of Contents</h2>\n\n<ul class="toc">\n${items}\n</ul>`;
}

/**
 * Renders a BragDoc to a human-readable markdown view, respecting
 * config's section order/inclusion. Each top-level section gets its
 * own page in the PDF output (see pdf-default-css.ts), with a table
 * of contents on the first page linking to each.
 */
export function renderMarkdown(doc: BragDoc, config: BragConfig): string {
  const rendered: RenderedSection[] = [];

  for (const key of config.sections.order) {
    if (!config.sections.include[key]) continue;

    switch (key) {
      case "executiveSummary": {
        const found = section(SECTION_HEADINGS.executiveSummary, esc(doc.executiveSummary));
        if (found) rendered.push(found);
        break;
      }
      case "summaryByType": {
        const hasEntries = doc.entries.length > 0 || doc.outsideWork.length > 0;
        const found = section("Summary", hasEntries ? renderSummaryByType(doc) : "");
        if (found) rendered.push(found);
        break;
      }
      case "entries": {
        const body = sortByImpactThenDate(doc.entries).map(formatBragEntry).join("\n\n");
        const found = section(ACCOMPLISHMENTS_TITLE, body);
        if (found) rendered.push(found);
        break;
      }
      case "learned": {
        const found = section(SECTION_HEADINGS.learned, renderLearnedSection(doc.learned));
        if (found) rendered.push(found);
        break;
      }
      case "feedback": {
        const found = section(SECTION_HEADINGS.feedback, renderFeedbackSection(doc.feedback));
        if (found) rendered.push(found);
        break;
      }
      case "outsideWork": {
        const body = sortByImpactThenDate(doc.outsideWork).map(formatBragEntry).join("\n\n");
        const found = section(SECTION_HEADINGS.outsideWork, body);
        if (found) rendered.push(found);
        break;
      }
    }
  }

  const parts = [
    `# ${esc(doc.title)}`,
    buildTableOfContents(rendered),
    ...rendered.map((s) => s.body),
  ];
  return parts.join("\n\n").trim() + "\n";
}

export const markdownRenderer: Renderer = {
  format: "markdown",
  async render(doc, config) {
    return renderMarkdown(doc, config);
  },
};
