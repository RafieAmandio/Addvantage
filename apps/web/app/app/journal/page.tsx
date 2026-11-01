import type { Metadata } from "next";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { JournalClient } from "@/features/journal/components/JournalClient";
import type { NewsEvent } from "@/features/journal/lib/journal";

export const metadata: Metadata = { title: "Trade Journal" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CCY: Record<string, string> = { US: "USD", EU: "EUR", DE: "EUR", UK: "GBP", GB: "GBP", JP: "JPY", AU: "AUD", CA: "CAD", CH: "CHF", NZ: "NZD", CN: "CNY" };

export default async function JournalPage() {
  const now = Date.now();
  // ponytail: events are read once per page load; a desk left open for hours should reload for the kill list to see new ones.
  const macro = await listTimelineEvents({ kinds: ["macro"], from: new Date(now - 3_600_000).toISOString(), to: new Date(now + 24 * 3_600_000).toISOString(), limit: 200 }).catch(() => []);
  const events: NewsEvent[] = macro.flatMap((e) => {
    const prefix = /^([A-Z]{3}) /.exec(e.title)?.[1];
    const currency = prefix ?? CCY[(e.symbols[0] ?? "").toUpperCase()];
    return currency && e.impact ? [{ ts: e.occurredAt, title: e.title, currency, impact: e.impact }] : [];
  });
  return <JournalClient events={events} />;
}
