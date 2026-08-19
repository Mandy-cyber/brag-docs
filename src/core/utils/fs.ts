import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Writes `content` to `filePath` atomically: writes to a sibling
 * temp file, then renames it over the target. A crash or concurrent
 * read mid-write never observes a partial file.
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${crypto.randomUUID()}.tmp`);
  try {
    await fs.writeFile(tmpPath, content, "utf8");
    await fs.rename(tmpPath, filePath);
  } catch (cause) {
    await fs.rm(tmpPath, { force: true });
    throw cause;
  }
}
