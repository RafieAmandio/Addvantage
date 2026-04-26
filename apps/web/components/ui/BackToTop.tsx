"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function BackToTop({
  threshold = 600,
  label = "TOP",
}: {
  threshold?: number;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        "fixed bottom-6 left-6 z-[55] flex items-center gap-2 border border-brand/60 bg-gray-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all",
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-2",
        "hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      )}
    >
      <span aria-hidden>↑</span>
      {label}
    </button>
  );
}
