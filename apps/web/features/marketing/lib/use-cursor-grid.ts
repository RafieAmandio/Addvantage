"use client";

import { useEffect, useState } from "react";

/** Follows the pointer with a hairline grid, only inside this section. */
export function useCursorGrid(ref: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: 0, y: 0, on: false });
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
      });
    };
    const leave = () => setPos((p) => ({ ...p, on: false }));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return pos;
}

/** The Ink hairline grid that shows only around the pointer. */
export function cursorGrid(m: { x: number; y: number; on: boolean }): React.CSSProperties {
  const mask = `radial-gradient(circle 320px at ${m.x}px ${m.y}px, black 0%, transparent 70%)`;
  return {
    opacity: m.on ? 1 : 0,
    backgroundImage: "linear-gradient(to right, rgba(17,18,20,.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,18,20,.07) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}
