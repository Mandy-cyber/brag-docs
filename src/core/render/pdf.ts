import path from "node:path";
import { mdToPdf } from "md-to-pdf";
import { renderMarkdown } from "./markdown.js";
import { DEFAULT_PDF_CSS } from "./pdf-default-css.js";
import type { Renderer } from "./types.js";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const HEADER_FOOTER_STYLE = "font-family: sans-serif; font-size: 8px; color: #8a94a3; width: 100%;";

function buildHeaderTemplate(docTitle: string): string {
  const label = escapeHtml(`${docTitle} — Accomplishments & Learnings`);
  return `<div style="${HEADER_FOOTER_STYLE} text-align: center; padding: 0 0.65in;">${label}</div>`;
}

const FOOTER_TEMPLATE =
  `<div style="${HEADER_FOOTER_STYLE} text-align: center;">` +
  `<span class="pageNumber"></span> / <span class="totalPages"></span></div>`;

export const pdfRenderer: Renderer = {
  format: "pdf",
  async render(doc, config): Promise<Buffer> {
    const markdown = renderMarkdown(doc, config);
    const result = await mdToPdf(
      { content: markdown },
      {
        css: DEFAULT_PDF_CSS,
        stylesheet: config.render.pdf.stylesheet
          ? [path.resolve(config.render.pdf.stylesheet)]
          : [],
        pdf_options: {
          format: config.render.pdf.pageFormat,
          margin: { top: "0.75in", bottom: "0.65in", left: "0.65in", right: "0.65in" },
          displayHeaderFooter: true,
          headerTemplate: buildHeaderTemplate(doc.title),
          footerTemplate: FOOTER_TEMPLATE,
        },
      },
    );
    return result.content;
  },
};
