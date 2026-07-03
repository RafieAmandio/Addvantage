import type { ConsultMessage, ConsultSession } from "@/features/consult/types";

export function sessionToMarkdown(
  session: ConsultSession,
  extras: ConsultMessage[]
): string {
  const allMessages = [...session.messages, ...extras];
  const lines: string[] = [
    `# ${session.title}`,
    ``,
    `**Session ID:** ${session.id}`,
    `**Started:** ${new Date(session.startedAt).toUTCString()}`,
    `**Messages:** ${allMessages.length}`,
  ];
  if (session.tags.length > 0) {
    lines.push(`**Tags:** ${session.tags.map((t) => `#${t}`).join(", ")}`);
  }
  lines.push(``, `---`, ``);

  for (const m of allMessages) {
    const who =
      m.role === "user"
        ? "Operator"
        : `Desk · ${m.author ?? "Team"}`;
    const ts = new Date(m.ts).toUTCString();
    lines.push(`### ${who} · ${ts}`);
    lines.push(``);
    lines.push(m.body);
    if (m.tags && m.tags.length > 0) {
      lines.push(``);
      lines.push(`> Tags: ${m.tags.map((t) => `#${t}`).join(", ")}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Exported from TradeVantage · ${session.id}*`);
  return lines.join("\n");
}
