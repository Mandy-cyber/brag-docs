import { NotImplementedError } from "../errors.js";
import type { Renderer } from "./types.js";

export const docxRenderer: Renderer = {
  format: "docx",
  async render() {
    throw new NotImplementedError(
      "DOCX output is not yet implemented — planned for a future release. " +
        "Use --format markdown or --format pdf.",
    );
  },
};
