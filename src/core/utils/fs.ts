import writeFileAtomicLib from "write-file-atomic";

/**
 * Writes `content` to `filePath` atomically: writes to a sibling
 * temp file, then renames it over the target. A crash or concurrent
 * read mid-write never observes a partial file. Also registers a
 * process-exit handler to remove the temp file on SIGINT/SIGTERM,
 * and serializes concurrent writes to the same path.
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  await writeFileAtomicLib(filePath, content, "utf8");
}
