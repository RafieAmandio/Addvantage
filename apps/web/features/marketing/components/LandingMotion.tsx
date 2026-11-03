"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * The page's motion layer. One IntersectionObserver marks `[data-reveal]`
 * elements `data-in` the first time they arrive and never takes it back (the
 * old page reset its sections whenever they left the screen, which is why they
 * showed as empty frames). Hidden start states only apply under
 * `html.lv-motion`, so without JS everything is simply there. The header tucks
 * away while scrolling down and comes back on the way up, and turns from clear to Paper
 * once the page has moved (`data-scrolled`). Endless loops (`[data-loop]`) pause off screen.
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
    const loops = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) target.toggleAttribute("data-paused", !isIntersecting);
    });
    document.querySelectorAll("[data-loop]").forEach((el) => loops.observe(el));
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
        root.toggleAttribute("data-scrolled", y > 8);
        lastY = y;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // Smooth wheel scrolling, same setup as Kaoba: mouse and trackpad only,
    // touch stays native, reduced motion gets none.
    const lenis = matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches
      ? new Lenis({ autoRaf: true, lerp: 0.075, anchors: { offset: -80 } })
      : null;
    return () => {
      lenis?.destroy();
      io.disconnect();
      loops.disconnect();
      window.removeEventListener("beforeprint", all);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      root.classList.remove("lv-motion");
      delete root.dataset.scrollDir;
      root.removeAttribute("data-scrolled");
    };
  }, []);
  return null;
}
