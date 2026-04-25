"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Vim-style j/k navigation between trading plans. Mounted inside the
 * server-rendered plan detail page with pre-resolved newer/older IDs.
 * j → older, k → newer, wraps at the ends with a small flash hint.
 */
export function PlanSiblingKeys({
  newerId,
  olderId,
  firstId,
  lastId,
}: {
  newerId: string | null;
  olderId: string | null;
  firstId: string;
  lastId: string;
}) {
  const router = useRouter();
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "j") {
        e.preventDefault();
        const wrapped = olderId === null;
        if (wrapped) {
          setHint("⟲ WRAPPED TO FIRST");
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setHint(null), 1200);
        }
        router.push(`/app/plan/${olderId ?? firstId}`);
      } else if (e.key === "k") {
        e.preventDefault();
        const wrapped = newerId === null;
        if (wrapped) {
          setHint("⟲ WRAPPED TO LAST");
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setHint(null), 1200);
        }
        router.push(`/app/plan/${newerId ?? lastId}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [newerId, olderId, firstId, lastId, router]);

  if (!hint) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 border border-brand bg-gray-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest2 text-brand shadow-[0_0_30px_rgba(245,158,11,0.3)]">
      {hint}
    </div>
  );
}
