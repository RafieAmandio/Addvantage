"use client";

import { useEffect } from "react";
import { DEMO_TODAY_YMD, type ViewMode } from "@/features/calendar/types";
import { addDays } from "@/features/calendar/lib/date";
import { stepAnchor } from "@/features/calendar/lib/view";

/**
 * Wire global keyboard shortcuts dispatched from the top-level Shortcuts
 * component into calendar navigation: [ / ] view-step, j / k day-step, t today.
 */
export function useCalendarKeyboard(
  view: ViewMode,
  setAnchor: (updater: (a: string) => string) => void,
  setAnchorAbsolute: (ymd: string) => void
) {
  useEffect(() => {
    const onStep = (e: Event) => {
      const dir = (e as CustomEvent<number>).detail === -1 ? -1 : 1;
      setAnchor((a) => stepAnchor(view, a, dir as 1 | -1));
    };
    const onDayStep = (e: Event) => {
      const dir = (e as CustomEvent<number>).detail === -1 ? -1 : 1;
      setAnchor((a) => addDays(a, dir));
    };
    const onToday = () => setAnchorAbsolute(DEMO_TODAY_YMD);
    window.addEventListener("ants:calendar-step", onStep);
    window.addEventListener("ants:calendar-day-step", onDayStep);
    window.addEventListener("ants:calendar-today", onToday);
    return () => {
      window.removeEventListener("ants:calendar-step", onStep);
      window.removeEventListener("ants:calendar-day-step", onDayStep);
      window.removeEventListener("ants:calendar-today", onToday);
    };
  }, [view, setAnchor, setAnchorAbsolute]);
}
