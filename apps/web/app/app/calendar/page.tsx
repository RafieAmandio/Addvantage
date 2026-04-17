import { Suspense } from "react";
import { CalendarFallback } from "@/features/calendar/components/CalendarFallback";
import { CalendarPageView } from "@/features/calendar/components/CalendarPageView";

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarPageView />
    </Suspense>
  );
}
