"use client";

import { useEffect, useRef, useState } from "react";
import type { ConsultMessage } from "@/features/consult/types";

export function ScrollableConversation({
  children,
  bottomRef,
  messages,
}: {
  children: React.ReactNode;
  bottomRef: React.RefObject<HTMLDivElement>;
  messages: ConsultMessage[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full space-y-5 overflow-y-auto px-5 py-4"
      >
        {children}
      </div>
      {showScrollTop && (
        <button
          onClick={() => {
            containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Scroll to top of conversation"
          title="Back to top"
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-[12px] font-medium text-white/70 ring-1 ring-white/[0.1] transition-colors hover:text-white focus-visible:ring-brand focus-visible:outline-none"
        >
          <span aria-hidden>↑</span>
          Top
        </button>
      )}
    </div>
  );
}
