"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlSyncedStateOptions {
  scroll?: boolean;
  preserveExisting?: boolean;
}

export function useUrlSyncedState(
  params: Record<string, string | null | undefined>,
  opts: UseUrlSyncedStateOptions = {},
): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { scroll = false, preserveExisting = false } = opts;

  // Serialized so the effect fires on value changes without spreading into dep array.
  const serialized = JSON.stringify(params);

  useEffect(() => {
    const sp = preserveExisting
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        sp.set(key, value);
      } else if (preserveExisting) {
        sp.delete(key);
      }
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll });
    // searchParams intentionally omitted — consult reads it once on init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, pathname, router, scroll, preserveExisting]);
}
