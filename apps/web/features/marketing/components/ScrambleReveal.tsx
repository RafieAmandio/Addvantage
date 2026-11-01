"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Letters decode left to right from noise. Spaces hold their place so the line never reflows. */
function play(text: string, duration: number, set: (s: string) => void) {
  const frames = Math.ceil(duration / 30);
  let frame = 0;
  const id = setInterval(() => {
    frame++;
    const progress = frame / frames;
    set(
      text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          const at = i / text.length;
          if (progress > at + 0.3) return ch;
          return progress > at ? CHARS[Math.floor(Math.random() * CHARS.length)]! : " ";
        })
        .join(""),
    );
    if (frame >= frames) {
      clearInterval(id);
      set(text);
    }
  }, 30);
  return () => clearInterval(id);
}

/** Decodes once on mount, after `delay`. */
export function ScrambleReveal({ text, delay = 0, duration = 800, className }: { text: string; delay?: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (calm()) return;
    setDisplay(text.replace(/\S/g, " "));
    let stop = () => {};
    const t = setTimeout(() => (stop = play(text, duration, setDisplay)), delay);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, [text, delay, duration]);
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}

/** Decodes the first time it scrolls into view. The real text is there before and after. */
export function Scramble({ text, delay = 0, duration = 700, className }: { text: string; delay?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const el = ref.current;
    if (!el || calm()) return;
    let stop = () => {};
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      t = setTimeout(() => (stop = play(text, duration, setDisplay)), delay);
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
      stop();
    };
  }, [text, delay, duration]);
  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
