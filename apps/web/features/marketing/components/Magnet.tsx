"use client";

import { useEffect, useRef } from "react";

/**
 * Leans its child toward a fine pointer, at most `max` px, and settles back when it leaves.
 * One rAF lerp, transform only, nothing on touch or under reduced motion.
 */
export function Magnet({ max = 4, children }: { max?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let raf = 0;
    const cur = { x: 0, y: 0 };
    const to = { x: 0, y: 0 };
    const tick = () => {
      cur.x += (to.x - cur.x) * 0.2;
      cur.y += (to.y - cur.y) * 0.2;
      el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px)`;
      raf = Math.abs(to.x - cur.x) + Math.abs(to.y - cur.y) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    const go = () => (raf ||= requestAnimationFrame(tick));
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      to.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))) * max;
      to.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))) * max;
      go();
    };
    const leave = () => {
      to.x = 0;
      to.y = 0;
      go();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <span ref={ref} className="inline-flex w-full sm:w-auto">
      {children}
    </span>
  );
}
