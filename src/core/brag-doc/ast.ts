import { toMarkdown } from "mdast-util-to-markdown";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Code, Heading, Root, RootContent } from "mdast";

/**
 * A depth-N heading together with the sibling nodes that follow it,
 * up to the next heading of that depth (or a shallower one).
 */
export interface HeadingSegment {
  heading: Heading;
  content: RootContent[];
}

/**
 * Splits a flat node list into segments anchored at each heading of
 * the given depth. Nodes before the first such heading are dropped.
 */
export function splitByHeadingDepth(nodes: RootContent[], depth: number): HeadingSegment[] {
  const segments: HeadingSegment[] = [];
  let current: HeadingSegment | null = null;

  for (const node of nodes) {
    if (node.type === "heading" && node.depth <= depth) {
      if (node.depth === depth) {
        current = { heading: node, content: [] };
        segments.push(current);
        continue;
      }
      // A heading shallower than `depth` ends the current segment.
      current = null;
      continue;
    }
    current?.content.push(node);
  }

  return segments;
}

/** Renders a slice of mdast nodes back to markdown prose, trimmed of surrounding whitespace. */
export function renderNodes(nodes: RootContent[]): string {
  const root: Root = { type: "root", children: nodes };
  return toMarkdown(root).trim();
}

/** Plain-text content of a heading node (strips inline formatting). */
export function headingText(heading: Heading): string {
  return mdastToString(heading).trim();
}

/** Finds the first fenced code block among `nodes` whose fence meta matches `meta` exactly. */
export function findFencedJson(nodes: RootContent[], meta: string): Code | undefined {
  return nodes.find(
    (node): node is Code => node.type === "code" && node.lang === "json" && node.meta === meta,
  );
}
