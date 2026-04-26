import type { ReactNode } from "react";

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
    i % 2 === 1 ? (
      <mark key={i} className="bg-brand/30 text-white">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
