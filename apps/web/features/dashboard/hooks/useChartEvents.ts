import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { TimelineKind } from "@/features/timeline/types";

export interface ChartEvent {
  id: string;
  time: string;
  kind: TimelineKind;
  title: string;
  body: string | null;
  sourceCode: string | null;
  bias: "bullish" | "bearish" | "neutral" | null;
  impact: "high" | "medium" | "low" | null;
  newsItemId: string | null;
}

interface TimelineRow {
  id: string;
  kind: TimelineKind;
  sourceCode: string | null;
  occurredAt: string;
  title: string;
  body: string | null;
  bias: string | null;
  impact: string | null;
  newsItemId: string | null;
}

export function useChartEvents(from: string, to: string, kinds: readonly TimelineKind[]) {
  const [events, setEvents] = useState<ChartEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const qs = new URLSearchParams({ from, to, limit: "200" });
    if (kinds.length > 0) qs.set("kinds", kinds.join(","));

    apiGet<TimelineRow[]>(`/timeline?${qs}`)
      .then((rows) => {
        if (cancelled) return;
        setEvents(
          rows.map((r) => ({
            id: r.id,
            time: r.occurredAt,
            kind: r.kind,
            title: r.title,
            body: r.body,
            sourceCode: r.sourceCode,
            bias: r.bias as ChartEvent["bias"],
            impact: r.impact as ChartEvent["impact"],
            newsItemId: r.newsItemId,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [from, to, kinds]);

  return { events, loading };
}
