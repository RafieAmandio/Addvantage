"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A number that counts to its value (ease-out quart) on mount and when it changes, and flashes
 * green or red when a refresh moves it. Server HTML carries the final value; reduced motion skips straight to it.
 */
export function AnimatedNumber({
  value,
  format,
  from,
  duration = 650,
  className,
}: {
  value: number;
  format: (n: number) => string;
  /** Where the first count starts; omit to show the value without counting. */
  from?: number;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  // The value on screen, written per frame. Null until the first frame, so a Strict Mode re-run still counts from `from`.
  const onScreen = useRef<number | null>(null);

  useEffect(() => {
    const start = onScreen.current ?? from ?? value;
    if (onScreen.current !== null && start !== value) setFlash(value > start ? "up" : "down");
    const show = (v: number) => {
      onScreen.current = v;
      setShown(v);
    };
    if (start === value || reduced()) {
      show(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      show(start + (value - start) * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `from` only matters for the first count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span
      className={cn("tabular-nums", flash === "up" && "flash-up", flash === "down" && "flash-down", className)}
      onAnimationEnd={() => setFlash(null)}
    >
      {format(shown)}
    </span>
  );
}

const NUM = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/;

/** AnimatedNumber for a preformatted string ("3,914.90", "3.60%", "7.18M"); anything else renders as is. */
export function AnimatedFigure({ text, fromRatio = 0, className }: { text: string; fromRatio?: number; className?: string }) {
  const m = NUM.exec(text);
  const n = m ? Number(m[2].replace(/,/g, "")) : NaN;
  if (!m || !Number.isFinite(n)) return <span className={className}>{text}</span>;
  const [, pre, raw, post] = m;
  const dp = raw.split(".")[1]?.length ?? 0;
  const grouped = raw.includes(",");
  const format = (v: number) =>
    pre + v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp, useGrouping: grouped }) + post;
  return <AnimatedNumber value={n} from={n * fromRatio} format={format} className={className} />;
}
