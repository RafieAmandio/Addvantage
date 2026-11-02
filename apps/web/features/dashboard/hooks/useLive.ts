import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Marks `el` with `.paused` while it is off screen or the tab is hidden, so the CSS loops (and the entrances) inside it
 * wait until it is in view. `onChange` hears the same state, for SMIL figures that pause through their own API.
 */
export function useActive<T extends Element>(onChange?: (on: boolean) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let seen = true;
    const apply = () => {
      const on = seen && !document.hidden;
      el.classList.toggle("paused", !on);
      cb.current?.(on);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      apply();
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);
  return ref;
}

/** Wall clock that re-renders every `ms` while the tab is visible. */
export function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => !document.hidden && setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms]);
  return now;
}

/** Calls `fn` every `ms` while the tab is visible (skips ticks on a hidden tab). */
export function useEvery(ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const id = setInterval(() => !document.hidden && cb.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
