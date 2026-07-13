"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, DetailedHTMLProps, HTMLAttributes } from "react";

// <model-viewer> is a custom element (Google). Declare it for JSX/TS.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "interaction-prompt"?: string;
        "disable-zoom"?: boolean;
        "disable-pan"?: boolean;
        "disable-tap"?: boolean;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        "field-of-view"?: string;
        loading?: string;
        reveal?: string;
      };
    }
  }
}

interface ModelEl extends HTMLElement {
  cameraOrbit?: string;
  exposure?: number;
  loaded?: boolean;
}

interface Props {
  src: string;
  /** static image shown until the model loads, or if WebGL can't render it */
  poster?: string;
  className?: string;
  style?: CSSProperties;
  /** turntable speed, degrees/second (deliberate = low) */
  idleSpeed?: number;
  /** total degrees the model rotates across the section's scroll travel */
  scrollSpin?: number;
  /** max degrees the model yaws/pitches toward the cursor (0 = off) */
  pointerTrack?: number;
  /** resting pitch: model-viewer phi, degrees from the top pole */
  basePhi?: number;
  /** camera distance, e.g. "auto" or "105%" */
  radius?: string;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function ModelViewer({
  src,
  poster,
  className,
  style,
  idleSpeed = 7,
  scrollSpin = 90,
  pointerTrack = 6,
  basePhi = 80,
  radius = "auto",
}: Props) {
  const ref = useRef<ModelEl | null>(null);

  useEffect(() => {
    import("@google/model-viewer");

    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion: one flattering static angle, full exposure, no loop.
    if (reduce) {
      const set = () => {
        el.cameraOrbit = `-20deg ${basePhi}deg ${radius}`;
        el.exposure = 1;
      };
      if (el.loaded) set();
      else el.addEventListener("load", set, { once: true });
      return;
    }

    // Motion state (all in degrees; pointer offsets are damped toward targets).
    let theta = -20; // idle turntable accumulator
    let ptYawTarget = 0, ptPitchTarget = 0, ptYaw = 0, ptPitch = 0;
    let scrollP = 0; // -0.5..0.5 across the section's viewport travel
    let revealStart = 0; // ms timestamp of first on-screen frame
    let inView = false;
    let raf = 0;
    let last = 0;

    const onPointer = (e: PointerEvent) => {
      if (!pointerTrack) return;
      ptYawTarget = (e.clientX / window.innerWidth - 0.5) * 2 * pointerTrack;
      ptPitchTarget = (e.clientY / window.innerHeight - 0.5) * 2 * (pointerTrack * 0.6);
    };

    const measureScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // center of element as it travels from bottom (0) to top (1) of viewport
      const p = 1 - (r.top + r.height / 2) / vh;
      scrollP = clamp(p, 0, 1) - 0.5;
    };

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      if (!revealStart) revealStart = now;
      const rt = clamp((now - revealStart) / 1100, 0, 1);
      const e = easeOutExpo(rt); // entrance progress

      theta += idleSpeed * dt;
      ptYaw = lerp(ptYaw, ptYawTarget, 0.06);
      ptPitch = lerp(ptPitch, ptPitchTarget, 0.06);

      // entrance: start pitched-up ("acquiring"), swing in from the side, dim -> lit
      const settleTheta = (1 - e) * -22;
      const settlePhi = (1 - e) * 16;
      const scrollTheta = scrollP * scrollSpin;

      const T = theta + scrollTheta + ptYaw + settleTheta;
      const P = clamp(basePhi + settlePhi + ptPitch, 12, 168);

      el.cameraOrbit = `${T}deg ${P}deg ${radius}`;
      el.exposure = lerp(0.35, 1, e);

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          measureScroll();
          start();
        } else {
          stop();
        }
      },
      { threshold: 0 }
    );
    io.observe(el);

    const onScroll = () => inView && measureScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [src, idleSpeed, scrollSpin, pointerTrack, basePhi, radius]);

  return (
    <model-viewer
      ref={ref}
      src={src}
      poster={poster}
      alt=""
      camera-orbit="-20deg 80deg auto"
      min-camera-orbit="auto 0deg auto"
      max-camera-orbit="auto 180deg auto"
      disable-zoom
      disable-pan
      disable-tap
      interaction-prompt="none"
      shadow-intensity="0"
      environment-image="neutral"
      exposure="0.35"
      loading="lazy"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        pointerEvents: "none",
        ["--poster-color" as string]: "transparent",
        ...style,
      }}
    />
  );
}
