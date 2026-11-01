"use client";

import { useEffect } from "react";

/**
 * The page's motion layer. One IntersectionObserver marks `[data-reveal]`
 * elements `data-in` the first time they arrive and never takes it back (the
 * old page reset its sections whenever they left the screen, which is why they
 * showed as empty frames). Hidden start states only apply under
 * `html.lv-motion`, so without JS everything is simply there. The header tucks
 * away while scrolling down and comes back on the way up.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("lv-motion");
    const io = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          target.setAttribute("data-in", "");
          io.unobserve(target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    const watch = () => document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => io.observe(el));
    watch();
    // Printing or saving the page shows everything.
    const all = () => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-in", ""));
    window.addEventListener("beforeprint", all);

    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        root.dataset.scrollDir = y > 160 && y > lastY ? "down" : "up";
        lastY = y;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const unsmooth = smoothWheel();
    return () => {
      unsmooth();
      io.disconnect();
      window.removeEventListener("beforeprint", all);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      root.classList.remove("lv-motion");
      delete root.dataset.scrollDir;
    };
  }, []);
  return null;
}

/**
 * Smooth wheel scrolling: the wheel moves a target and the page eases toward
 * it each frame. Mouse and trackpad only; touch, keyboard, zoom (ctrl+wheel)
 * and reduced motion stay native. Anchor links already glide through the
 * global `scroll-behavior: smooth`, which is switched off here while the wheel
 * drives so the two don't fight.
 */
function smoothWheel() {
  if (!matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return () => {};
  const html = document.documentElement;
  let target = window.scrollY;
  let raf = 0;
  const max = () => html.scrollHeight - window.innerHeight;
  const tick = () => {
    const y = window.scrollY;
    const d = target - y;
    if (Math.abs(d) < 0.5) {
      window.scrollTo(0, target);
      raf = 0;
      html.style.scrollBehavior = "";
      return;
    }
    window.scrollTo(0, y + d * 0.12);
    raf = requestAnimationFrame(tick);
  };
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented) return;
    e.preventDefault();
    if (!raf) target = window.scrollY;
    const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    target = Math.max(0, Math.min(max(), target + dy));
    html.style.scrollBehavior = "auto";
    if (!raf) raf = requestAnimationFrame(tick);
  };
  // Scrollbar drags, keys and anchor jumps move the page directly: follow them.
  const sync = () => {
    if (!raf) target = window.scrollY;
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", sync, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    html.style.scrollBehavior = "";
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", sync);
  };
}
