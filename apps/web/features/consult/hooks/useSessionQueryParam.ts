"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Two-way sync between a local `sessionQuery` string and the URL's `?sq=...`
 * parameter. Initial state reads from the URL; subsequent changes push a
 * non-scrolling `router.replace` back out.
 */
export function useSessionQueryParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sessionQuery, setSessionQuery] = useState<string>(
    () => searchParams.get("sq")?.trim() ?? ""
  );

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (sessionQuery) {
      sp.set("sq", sessionQuery);
    } else {
      sp.delete("sq");
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // searchParams is fetched once via initial state; intentionally not a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery, pathname, router]);

  return [sessionQuery, setSessionQuery] as const;
}
