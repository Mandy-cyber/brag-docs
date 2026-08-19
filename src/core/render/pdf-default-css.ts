/** Built-in PDF styling, used unless the user configures a custom `render.pdf.stylesheet`. */
export const DEFAULT_PDF_CSS = `
body {
  font-family: Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif;
  font-size: 14px;
  color: #24292f;
  line-height: 1.55;
  max-width: 680px;
  margin: 0 auto;
}
h1, h2, h3 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-weight: 600;
  color: #14171f;
}
h1 {
  font-size: 1.7em;
  letter-spacing: -0.01em;
  margin-bottom: 0.15em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #14171f;
}
h2 {
  font-size: 1.55em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #3b4252;
  margin-top: 0;
  margin-bottom: 0.6em;
  border-bottom: 1px solid #d0d5dd;
  padding-bottom: 0.3em;
  page-break-before: always;
  break-before: page;
}
h2.toc-heading {
  page-break-before: avoid;
  break-before: avoid;
}
h3 {
  font-size: 1.05em;
  margin-top: 1.3em;
  margin-bottom: 0.35em;
  padding-top: 1.1em;
  border-top: 1px solid #e4e7ec;
}
h2 + h3 {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}
p { margin: 0.5em 0; }
a { color: #1a56b0; text-decoration: none; }
a:hover { text-decoration: underline; }
ul { padding-left: 1.3em; margin: 0.5em 0; }
li { margin: 0.15em 0; }
ul.toc { list-style: none; padding-left: 0; }
ul.toc li { margin: 0.5em 0; }
ul.toc a { font-size: 1.05em; }
code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.92em;
  background: #f2f3f5;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}
.entry-meta {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 0.82em;
  color: #5b6472;
  margin-bottom: 0.6em;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5em 0 1em;
  font-size: 0.92em;
}
th, td {
  text-align: left;
  padding: 0.45em 0.6em;
  border-bottom: 1px solid #e4e7ec;
  vertical-align: top;
}
th {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-weight: 600;
  font-size: 0.85em;
  color: #5b6472;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #d0d5dd;
}
`;
