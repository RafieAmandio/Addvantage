"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-md border bg-gray-2 shadow-[0_0_60px_rgba(245,158,11,0.18)]",
          destructive ? "border-blood" : "border-brand"
        )}
      >
        <div className="classification-stripe absolute -top-1 left-0 right-0 h-1" />
        <div className="border-b border-gray-3 p-5">
          <div
            className={cn(
              "font-mono text-[10px] uppercase tracking-widest2",
              destructive ? "text-blood-bright" : "text-brand"
            )}
          >
            ● {destructive ? "DESTRUCTIVE · CONFIRM REQUIRED" : "CONFIRM REQUIRED"}
          </div>
          <h3
            id="confirm-title"
            className="mt-2 font-display text-2xl leading-tight text-white"
          >
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm text-white/60">{description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <button
            onClick={onCancel}
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            {cancelLabel} · esc
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "border px-5 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
              destructive
                ? "border-blood bg-blood/10 text-blood-text hover:bg-blood hover:text-white"
                : "border-brand bg-brand text-black hover:bg-brand-dim hover:text-white"
            )}
          >
            {confirmLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
