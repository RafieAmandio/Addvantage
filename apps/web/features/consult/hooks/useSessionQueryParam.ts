"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";

/**
 * Two-way sync between a local `sessionQuery` string and the URL's `?sq=...`
 * parameter. Initial state reads from the URL; subsequent changes push a
 * non-scrolling `router.replace` via `useUrlSyncedState` in `preserveExisting`
 * mode so other query params on the page stay intact.
 */
export function useSessionQueryParam() {
  const searchParams = useSearchParams();
  const [sessionQuery, setSessionQuery] = useState<string>(
    () => searchParams.get("sq")?.trim() ?? ""
  );

  useUrlSyncedState(
    { sq: sessionQuery || null },
    { preserveExisting: true },
  );

  return [sessionQuery, setSessionQuery] as const;
}
