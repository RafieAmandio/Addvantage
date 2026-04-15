import { createHash } from "node:crypto";

/**
 * Stable content hash for dedupe. Normalises whitespace so trivial
 * reformatting doesn't create "new" rows.
 */
export function contentHash(parts: (string | null | undefined)[]): string {
  const joined = parts
    .filter(Boolean)
    .map((s) => String(s).replace(/\s+/g, " ").trim())
    .join("\u241E");
  return createHash("sha256").update(joined).digest("hex");
}
