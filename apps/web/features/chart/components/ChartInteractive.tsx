"use client";

import { useCallback, useMemo, useState } from "react";
import {
  PriceChart,
  type Bar as ChartBar,
  type ChartMarker,
} from "@/features/chart/components/PriceChart";
import { AddPinButton } from "@/features/timeline/components/AddPinButton";
import { EventDrawer } from "@/features/timeline/components/EventDrawer";
import type { TimelineEvent } from "@/features/timeline/types";

export interface ChartInteractiveProps {
  bars: ChartBar[];
  events: TimelineEvent[];
  markers: ChartMarker[];
  symbol: string;
  seriesType?: "candlestick" | "area";
  height?: number;
}

export function ChartInteractive({
  bars,
  events,
  markers,
  symbol,
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
      <div className="border border-gray-3 bg-gray-2 p-3">
        <div className="mb-3 flex items-center justify-end">
          <AddPinButton symbol={symbol} />
        </div>
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
