"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackVisit } from "@/lib/visits";

/**
 * Mounted once in the dashboard layout. Records every route change so the
 * search palette can surface "recent surfaces" — different from search history.
 * Preserves the querystring so, e.g., a filtered calendar view is remembered
 * with its filters.
 */
export function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <VisitTrackerInner />
    </Suspense>
  );
}

function VisitTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  useEffect(() => {
    trackVisit(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, qs]);
  return null;
}
