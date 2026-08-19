import type { BragDoc } from "../brag-doc/types.js";
import type { BragConfig } from "../config/schema.js";

/** Produces one output artifact (markdown, PDF, ...) from a BragDoc under the active config. */
export interface Renderer {
  readonly format: string;
  render(doc: BragDoc, config: BragConfig): Promise<Buffer | string>;
}
