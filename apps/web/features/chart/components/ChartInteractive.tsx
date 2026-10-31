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

interface ChartInteractiveProps {
  bars: ChartBar[];
  events: TimelineEvent[];
  markers: ChartMarker[];
  symbol: string;
  seriesType?: "candlestick" | "area";
  height?: number;
  /** Controls shown left of the pin button, above the chart. */
  toolbar?: React.ReactNode;
}

export function ChartInteractive({
  bars,
  events,
  markers,
  symbol,
  seriesType = "candlestick",
  height = 520,
  toolbar,
}: ChartInteractiveProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">{toolbar}</div>
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
