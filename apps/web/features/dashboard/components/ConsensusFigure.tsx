"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useActive } from "@/features/dashboard/hooks/useLive";

// The figures carry their own SMIL loops (scripts/consensus-figures/figs.html). Inlined, not <img>, so the page can
// pause them and turn the two data hooks: [data-needle] and [data-glint].
const svgs = new Map<string, Promise<string>>();
function load(theme: string) {
  let p = svgs.get(theme);
  if (!p) {
    p = fetch(`/consensus/${theme}.svg`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    svgs.set(theme, p);
  }
  return p;
}

interface FigProps {
  theme: string;
  /** Top outcome, 0..1: where the bank's rate dial points. */
  needle: number | null;
  /** Seconds per gold glint pass: faster for a bigger move. */
  glint: number;
}

function Figure({ theme, needle, glint, className, onAnimationEnd }: FigProps & { className?: string; onAnimationEnd?: () => void }) {
  const [html, setHtml] = useState("");
  const host = useActive<HTMLDivElement>((on) => {
    const svg = host.current?.querySelector("svg");
    if (!svg) return;
    if (on && !prefersReducedMotion()) svg.unpauseAnimations();
    else svg.pauseAnimations();
  });

  useEffect(() => {
    let live = true;
    load(theme).then((t) => live && setHtml(t));
    return () => {
      live = false;
    };
  }, [theme]);

  useEffect(() => {
    const svg = host.current?.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("aria-hidden", "true");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.display = "block";
    const n = svg.querySelector("[data-needle]");
    if (n && needle !== null) n.setAttribute("transform", `rotate(${(180 - 180 * Math.min(1, Math.max(0, needle))).toFixed(1)})`);
    svg.querySelector("[data-glint]")?.setAttribute("dur", `${glint.toFixed(2)}s`);
    // Reduced motion: hold the resting frame (frame 0 is the figure as drawn).
    if (prefersReducedMotion()) {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
    }
  }, [html, needle, glint, host]);

  return (
    <div className={className} data-ready={html ? "" : undefined} onAnimationEnd={(e) => e.target === e.currentTarget && onAnimationEnd?.()}>
      {/* Floor shadow: tightens and darkens as the figure lands on it. */}
      <span className="fig-floor" aria-hidden />
      <div className="fig-fall">
        <div ref={host} className="fig-art" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

/**
 * The consensus panel's anchor: an isometric figure for the market's theme that idles in place, tilts toward the
 * pointer, and on a market switch lifts away while the next one drops onto the desk.
 */
export function ConsensusFigure({ id, ...fig }: FigProps & { id: string | number }) {
  const [cur, setCur] = useState({ id, fig });
  const [old, setOld] = useState<{ id: string | number; fig: FigProps } | null>(null);
  if (id !== cur.id) {
    setOld(cur);
    setCur({ id, fig });
  } else if (fig.needle !== cur.fig.needle || fig.glint !== cur.fig.glint || fig.theme !== cur.fig.theme) {
    setCur({ id, fig });
  }

  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = stage.current;
    if (!el || e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--tx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--ty", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    stage.current?.style.setProperty("--tx", "0");
    stage.current?.style.setProperty("--ty", "0");
  };

  return (
    <div ref={stage} className="fig-stage relative aspect-[4/3] w-full" onPointerMove={onMove} onPointerLeave={onLeave}>
      {old && <Figure key={`o${old.id}`} {...old.fig} className="fig fig-leave" onAnimationEnd={() => setOld(null)} />}
      <Figure key={`c${cur.id}`} {...cur.fig} className="fig fig-drop" />
    </div>
  );
}
