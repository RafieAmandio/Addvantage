import type { ReactNode } from "react";

/**
 * Wraps matches of `query` tokens in the given `text` with a <mark> element.
 * Case-insensitive, whole-string (not word-boundary). Tokens of 1 character
 * are ignored to avoid highlighting every vowel when the user is mid-type.
 *
 * The shared implementation so the search palette, plan archive, and
 * anything else with a text search can all render the same visual marker.
 */
export function Highlight({
  text,
  query,
}: {
  text: string;
  query: string;
}): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) return text;
  const escaped = tokens.map((t) =>
    t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
  );
  const re = new RegExp(`(${escaped.join("|")})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-amber/30 text-paper">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
