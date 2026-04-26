import type { ConsultMessage, ConsultSession } from "@/lib/mock/types";

export function sessionMatchesQuery(
  s: ConsultSession,
  extras: ConsultMessage[],
  q: string
): boolean {
  if (!q) return true;
  const allMessages = [...s.messages, ...extras];
  const haystack = [s.id, s.title, ...s.tags, ...allMessages.map((m) => m.body)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}
