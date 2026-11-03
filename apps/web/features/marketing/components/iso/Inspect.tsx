"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** What a figure says about one of its objects when it is hovered, tapped or focused. */
export type Info = { main: string; lines?: string[]; aria: string; onPress?: () => void; onKey?: (e: React.KeyboardEvent) => boolean };

/**
 * Inspect state for a figure: hover (mouse), tap or keyboard focus makes one object active.
 * `bind` goes on the object's group: it becomes a focusable button with its data as the label.
 */
export function useInspect() {
  const [active, setActive] = useState<string | null>(null);
  const [ring, setRing] = useState(false);
  const off = (id: string) => setActive((a) => (a === id ? null : a));
  const bind = (id: string, info: Info) => ({
    className: "tv-obj",
    "data-active": active === id || undefined,
    tabIndex: 0,
    role: "button",
    "aria-label": info.aria,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setActive(id),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && off(id),
    onFocus: (e: React.FocusEvent<Element>) => {
      setActive(id);
      setRing(e.currentTarget.matches(":focus-visible"));
    },
    onBlur: () => {
      off(id);
      setRing(false);
    },
    onClick: () => {
      setActive(id);
      info.onPress?.();
    },
    onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => {
      if (info.onKey?.(e)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        info.onPress?.();
      } else if (e.key === "Escape") e.currentTarget.blur();
    },
  });
  return { active, ring, bind, set: setActive, clear: () => setActive(null) };
}

/**
 * The inspect callout: dot on the anchor, straight up (or down) to `ey`, then a short run toward
 * the middle so the text never leaves the figure. Same hairline as the spec labels.
 */
export function callout(ax: number, ay: number, ey: number, mid: number) {
  const side = ax > mid ? ("end" as const) : ("start" as const);
  const ex = ax + (side === "end" ? -22 : 22);
  return { ax, ay, ex, ey, side, up: ey < ay, d: `M${ax.toFixed(2)} ${ay.toFixed(2)}V${ey.toFixed(2)}H${ex.toFixed(2)}` };
}

export const CalloutPath = ({ c }: { c: ReturnType<typeof callout> }) => (
  <g className="tv-callout" pointerEvents="none">
    <circle cx={c.ax} cy={c.ay} r={2.4} fill="currentColor" />
    <path d={c.d} pathLength={1} strokeDasharray={1} fill="none" stroke="currentColor" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
  </g>
);

/** Point in a convex screen polygon. */
export function inside(h: [number, number][], x: number, y: number) {
  let s = 0;
  for (let i = 0; i < h.length; i++) {
    const [ax, ay] = h[i]!;
    const [bx, by] = h[(i + 1) % h.length]!;
    const c = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (c && s && c !== s) return false;
    s ||= c;
  }
  return true;
}

/** The callout's text, bottom line level with the leader's end, growing upward. */
export function CalloutLabel({ c, info, left, top }: { c: ReturnType<typeof callout>; info: Info; left: string; top: string }) {
  return (
    <div className={cn("tv-label tv-callout-label absolute", c.side === "end" ? "items-end pr-2 text-right" : "pl-2")} style={{ left, top, ["--tx" as string]: c.side === "end" ? "-100%" : "0", ["--ty" as string]: c.up ? "calc(-100% + 7px)" : "-7px" }} aria-hidden>
      <span className="tv-label-main">{info.main}</span>
      {info.lines?.map((l) => (
        <span key={l} className="tv-label-sub">
          {l}
        </span>
      ))}
    </div>
  );
}

/** Leans its child toward the pointer, a few degrees, fine pointers only; flat again on leave. */
export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const lean = (el: HTMLElement, x: number, y: number) => {
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
  };
  return (
    <div
      className={cn("tv-tilt", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        lean(e.currentTarget, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={(e) => lean(e.currentTarget, 0, 0)}
    >
      {children}
    </div>
  );
}
