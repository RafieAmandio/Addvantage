"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)"; // --tv-ease-out
const BUILD_MS = 640; // --tv-build

/**
 * Plays an isometric figure's build once: every `[data-build]` group rises or slides from its
 * offset (WAAPI, transform and opacity only), every `[data-cue]` gets `data-on` after its delay
 * so CSS can draw leaders and roll prices. Below the fold it waits until the figure is a third
 * on screen. Reduced motion skips straight to the end state.
 */
export function useBuild<T extends HTMLElement>(immediate = false) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cues = [...el.querySelectorAll<HTMLElement | SVGElement>("[data-cue]")];
    const builds = [...el.querySelectorAll<SVGElement | HTMLElement>("[data-build]")];
    const done = () => {
      builds.forEach((b) => (b.style.opacity = "1"));
      cues.forEach((c) => c.setAttribute("data-on", ""));
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    const timers: number[] = [];
    const anims: Animation[] = [];
    const play = () => {
      for (const b of builds) {
        const { dx = "0", dy = "0", at = "0", ms, fade } = b.dataset;
        anims.push(
          b.animate(
            fade === undefined
              ? // Extrusions: hidden until their turn, then the lid appears on the floor and rises.
                [
                  { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
                  { transform: `translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.06 },
                  { transform: "translate(0, 0)", opacity: 1 },
                ]
              : [
                  { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
                  { transform: "translate(0, 0)", opacity: 1 },
                ],
            { duration: Number(ms ?? BUILD_MS), delay: Number(at), easing: EASE, fill: "both" },
          ),
        );
      }
      for (const c of cues) timers.push(window.setTimeout(() => c.setAttribute("data-on", ""), Number(c.dataset.cue)));
      // The rejection: the part of the candle past the level sinks back into the body.
      for (const x of el.querySelectorAll<SVGElement>("[data-ext]")) {
        const { dy = "0", at = "0" } = x.dataset;
        anims.push(
          x.animate(
            [
              { transform: "translate(0, 0)", opacity: 1 },
              { transform: "translate(0, 0)", opacity: 1, offset: 0.45 },
              { transform: `translate(0, ${dy}px)`, opacity: 1 },
            ],
            { duration: 1300, delay: Number(at), easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "backwards" },
          ),
        );
      }
    };
    let io: IntersectionObserver | undefined;
    if (immediate) play();
    else {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e?.isIntersecting) return;
          io?.disconnect();
          play();
        },
        { threshold: 0.3 },
      );
      io.observe(el);
    }
    window.addEventListener("beforeprint", done);
    return () => {
      io?.disconnect();
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.finish());
      window.removeEventListener("beforeprint", done);
    };
  }, [immediate]);
  return ref;
}

/** A figure that builds the first time it scrolls in. */
export function Build({ className, style, immediate, children }: { className?: string; style?: React.CSSProperties; immediate?: boolean; children: React.ReactNode }) {
  const ref = useBuild<HTMLDivElement>(immediate);
  return (
    <div ref={ref} className={cn("tv-figure", className)} style={style}>
      {children}
    </div>
  );
}
