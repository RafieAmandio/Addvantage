"use client";

import { useCallback, useMemo, useState } from "react";
import {
  PriceChart,
  type Bar as ChartBar,
  type ChartMarker,
} from "@/features/chart/components/PriceChart";
import { EventDrawer } from "@/features/timeline/components/EventDrawer";
import type { TimelineEvent } from "@/features/timeline/types";

export interface ChartInteractiveProps {
  bars: ChartBar[];
  events: TimelineEvent[];
  markers: ChartMarker[];
  seriesType?: "candlestick" | "area";
  height?: number;
}

/**
 * Client shell that owns the "which event is selected" state and wires the
 * chart's marker-click path into a shared `EventDrawer`. The server page
 * stays thin — it just fetches bars + events and passes them in.
 */
export function ChartInteractive({
  bars,
  events,
  markers,
  seriesType = "candlestick",
  height = 520,
}: ChartInteractiveProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Index events by id so marker-click → event is O(1) instead of scanning
  // on every click. Rebuilds only when the event list actually changes.
  const byId = useMemo(() => {
    const m = new Map<string, TimelineEvent>();
    for (const e of events) m.set(e.id, e);
    return m;
  }, [events]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  const selectedEvent = selectedId ? byId.get(selectedId) ?? null : null;

  return (
    <>
      <div className="border border-ink-3 bg-ink-2 p-3">
        <PriceChart
          bars={bars}
          seriesType={seriesType}
          height={height}
          markers={markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>
      <EventDrawer event={selectedEvent} onClose={handleClose} />
    </>
  );
}

export default ChartInteractive;
