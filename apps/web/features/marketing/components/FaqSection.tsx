"use client";

import { useEffect, useRef, useState } from "react";
import { faq } from "@/features/marketing/lib/data";
import { ModelViewer } from "@/features/marketing/components/ModelViewer";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

/**
 * The voxel model, only once it is near the screen and only on a desktop
 * pointer. Phones and reduced motion get the still render, which is the same
 * model photographed.
 */
function LazyModel() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      setLive(true);
      io.disconnect();
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="h-full w-full">
      {live ? (
        <ModelViewer src="/models/discord.glb" poster="/figma/discord.png" idleSpeed={4} scrollSpin={60} pointerTrack={3} basePhi={84} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/figma/discord.png" alt="" loading="lazy" className="lv-dance h-full w-full object-contain" />
      )}
    </div>
  );
}

/** Follows the pointer with a yellow grid, only inside this section. */
function useCursorGrid(ref: React.RefObject<HTMLElement>) {
  const [pos, setPos] = useState({ x: 0, y: 0, on: false });
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine)").matches) return;
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

export function FaqSection() {
  const ref = useRef<HTMLElement>(null);
  const m = useCursorGrid(ref);
  const mask = `radial-gradient(circle 320px at ${m.x}px ${m.y}px, black 0%, transparent 70%)`;

  return (
    <section ref={ref} id="chat-room" className="relative z-10 overflow-hidden bg-black py-20 text-white md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: m.on ? 1 : 0,
          backgroundImage: "linear-gradient(to right, rgba(255,212,0,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,212,0,.14) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-[1240px] gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-16 md:px-10">
        <div className="relative flex min-h-[420px] flex-col md:min-h-[640px]">
          <h2 data-reveal className="font-mono text-[clamp(2.2rem,6vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            <Scramble text="Where's the chat room?" duration={900} />
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="mt-4 font-mono text-2xl">
            <span className="font-light">Nowhere. </span>
            <span className="font-bold text-brand">4 reasons.</span>
          </p>
          <div data-reveal="pop" style={{ ["--i" as string]: 2 }} className="pointer-events-none absolute inset-x-[-10%] bottom-[-8%] top-[30%] md:inset-x-[-20%] md:bottom-[-16%] md:top-[22%]">
            <LazyModel />
          </div>
        </div>

        <ol className="border-t border-white/20">
          {faq.map((f, i) => (
            <li key={f.q} data-reveal style={{ ["--i" as string]: i }} className="group grid grid-cols-[3.5rem_1fr] gap-x-3 border-b border-white/20 py-7 md:py-9">
              <span className="font-mono text-sm tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-mono text-xl font-bold leading-snug md:text-2xl">
                  <Scramble text={f.q} delay={120 + i * 120} />
                </h3>
                <p className="mt-2 max-w-[52ch] font-mono text-sm font-light leading-relaxed text-white/85 md:text-base">{f.a}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
