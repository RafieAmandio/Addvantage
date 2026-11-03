"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short scripted animation: `step` climbs 0, 1, 2... with the given gaps (ms
 * before each next step) while the element is on screen, holds on the last
 * step, then plays again and calls `onLoop`. Off screen it pauses; reduced
 * motion shows the last step and never plays.
 */
export function useStory(gaps: readonly number[], hold = 4000, onLoop?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState(false);
  const loop = useRef(onLoop);
  loop.current = onLoop;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(gaps.length);
      return;
    }
    const io = new IntersectionObserver(([e]) => setSeen(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [gaps.length]);

  useEffect(() => {
    if (!seen) return;
    const last = step >= gaps.length;
    const t = setTimeout(() => {
      if (last) loop.current?.();
      setStep(last ? 0 : step + 1);
    }, last ? hold : gaps[step] ?? 0);
    return () => clearTimeout(t);
  }, [seen, step, gaps, hold]);

  return [ref, step] as const;
}
