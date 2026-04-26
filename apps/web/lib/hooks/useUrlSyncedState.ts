"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlSyncedStateOptions {
  /** Scroll to top on replace. Defaults to `false` (desired for filter UIs). */
  scroll?: boolean;
  /**
   * If true, start from the current URL's searchParams and only override the
   * keys in `params` (set on truthy, delete on falsy). If false/omitted, build
   * a fresh `URLSearchParams` so any key not in `params` is dropped.
   */
  preserveExisting?: boolean;
}

/**
 * One-way write-side sync: push a map of `{ key: value }` entries into the
 * URL via `router.replace`. Falsy values (empty string / null / undefined)
 * omit the key. An empty qs omits the `?` entirely. Non-scrolling by default.
 *
 * Style-matched to `usePersistedStringSet.ts`. The URL→state *read* on mount
 * is intentionally out of scope — keep that in each call site's `useState`
 * initializer where the parsing is already specific.
 */
export function useUrlSyncedState(
  params: Record<string, string | null | undefined>,
  opts: UseUrlSyncedStateOptions = {},
): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { scroll = false, preserveExisting = false } = opts;

  // Serialize the params dict so the effect fires on any value change without
  // requiring the caller to spread entries into the dep array.
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
    // `params` is re-built each render; `serialized` captures its content.
    // `searchParams` is intentionally omitted to match prior behavior of the
    // preserveExisting call site (consult), which read it once on init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, pathname, router, scroll, preserveExisting]);
}
