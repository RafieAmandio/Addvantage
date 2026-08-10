import { cn } from "@/lib/cn";

/**
 * Renders author-written long text the way it was typed.
 *
 * Blank lines become separate paragraphs (so the block gets real vertical
 * rhythm), and inside each paragraph `whitespace-pre-wrap` keeps single line
 * breaks AND leading spaces — the latter matters for hand-drawn ASCII
 * breakdowns that authors paste into a thesis.
 *
 * Without this, `{text}` in a plain <p> collapses every newline and the whole
 * thing renders as one wall of prose.
 */
export function ProseText({
  text,
  className,
  paragraphClassName,
}: {
  text: string;
  className?: string;
  paragraphClassName?: string;
}) {
  const blocks = splitParagraphs(text);

  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, i) => (
        <p key={i} className={cn("whitespace-pre-wrap", paragraphClassName)}>
          {block}
        </p>
      ))}
    </div>
  );
}

/** Normalises CRLF (pasted from Windows/Word) then splits on blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.replace(/\s+$/, ""))
    .filter((b) => b.trim().length > 0);
}

/** Flattens all whitespace to single spaces — for clamped one-line previews. */
export function flattenText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
