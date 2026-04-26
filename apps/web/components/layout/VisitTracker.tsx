"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackVisit } from "@/lib/visits";

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
