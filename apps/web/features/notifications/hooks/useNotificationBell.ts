"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import type { MockNotification } from "@/features/notifications/mock";

interface UseNotificationBellArgs {
  visible: MockNotification[];
  markRead: (id: string) => void;
}

interface UseNotificationBellResult {
  open: boolean;
  setOpen: (o: boolean | ((prev: boolean) => boolean)) => void;
  activeIdx: number;
  setActiveIdx: (n: number) => void;
  panelRef: RefObject<HTMLDivElement>;
  buttonRef: RefObject<HTMLButtonElement>;
}

/**
 * Encapsulates all imperative bell behaviors: open state, outside-click,
 * keyboard navigation, global `ants:bell-toggle` shortcut, active-row reset
 * on filter change, and scroll-into-view of the active row.
 */
export function useNotificationBell({
  visible,
  markRead,
}: UseNotificationBellArgs): UseNotificationBellResult {
  const router = useRouter();
  const [open, setOpenState] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const setOpen: UseNotificationBellResult["setOpen"] = (o) => {
    setOpenState((prev) => (typeof o === "function" ? o(prev) : o));
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) {
        return;
      }
      setOpenState(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keyboard navigation inside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenState(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveIdx(Math.min(visible.length - 1, activeIdx + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveIdx(Math.max(0, activeIdx - 1));
      } else if (e.key === "Enter") {
        const target = visible[activeIdx];
        if (target) {
          e.preventDefault();
          markRead(target.id);
          setOpenState(false);
          router.push(target.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, visible, markRead, router]);

  // Scroll the active row into view inside the panel's scroll container
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(
      `[data-notif-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx, open]);

  // Listen for global `n` shortcut from Shortcuts.tsx
  useEffect(() => {
    const onToggle = () => setOpenState((o) => !o);
    window.addEventListener("ants:bell-toggle", onToggle);
    return () => window.removeEventListener("ants:bell-toggle", onToggle);
  }, []);

  return {
    open,
    setOpen,
    activeIdx,
    setActiveIdx,
    panelRef,
    buttonRef,
  };
}
