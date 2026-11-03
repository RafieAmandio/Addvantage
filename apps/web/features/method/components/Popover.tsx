"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Button plus panel: a dropdown from sm up, a bottom sheet on phones.
 * Escape and a click outside close it, and focus goes back to the button.
 */
export function Popover({
  label,
  trigger,
  triggerClass,
  panelClass,
  align = "left",
  children,
}: {
  /** Accessible name of the panel. */
  label: string;
  trigger: (open: boolean) => React.ReactNode;
  triggerClass: (open: boolean) => string;
  /** Width and padding from sm up. */
  panelClass?: string;
  align?: "left" | "right";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="relative shrink-0">
      <button ref={btn} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close() : setOpen(true))} className={triggerClass(open)}>
        {trigger(open)}
      </button>
      {open && (
        <>
          {/* Click outside closes; dims the page only as a phone sheet. */}
          <div className="fixed inset-0 z-40 bg-black/60 sm:bg-transparent" onClick={close} aria-hidden />
          <div
            ref={panel}
            role="dialog"
            aria-label={label}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-raised p-4 pb-6 shadow-2xl ring-1 ring-white/10 motion-safe:animate-[rise_150ms_ease-out]",
              "sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:max-h-[70vh] sm:rounded-2xl sm:p-3",
              align === "right" ? "sm:right-0" : "sm:left-0",
              panelClass,
            )}
          >
            {children(close)}
            <button type="button" onClick={close} className="mt-3 h-10 w-full rounded-full bg-white text-[14px] font-semibold text-black sm:hidden">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
