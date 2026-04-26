"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";

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
