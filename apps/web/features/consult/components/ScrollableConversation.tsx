"use client";

import { useEffect, useRef, useState } from "react";
import type { ConsultMessage } from "@/features/consult/types";

export function ScrollableConversation({
  children,
  bottomRef,
  typing,
  messages,
}: {
  children: React.ReactNode;
  bottomRef: React.RefObject<HTMLDivElement>;
  typing: boolean;
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
  }, [messages.length, typing]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full space-y-4 overflow-y-auto bg-black p-5"
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
          className="absolute right-4 top-4 z-10 flex items-center gap-2 border border-brand/60 bg-gray-2 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand"
        >
          <span aria-hidden>↑</span>
          TOP
        </button>
      )}
    </div>
  );
}
