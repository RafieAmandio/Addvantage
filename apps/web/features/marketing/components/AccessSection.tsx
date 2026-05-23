"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ArrowUpPixel } from "@/features/marketing/components/icons";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function useScrambleText(text: string, trigger: boolean, duration = 600) {
  const [display, setDisplay] = useState(text);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (!trigger) { prevTrigger.current = false; return; }
    if (prevTrigger.current) return;
    prevTrigger.current = true;

    const steps = 12;
    const interval = duration / steps;
    let step = 0;

    setDisplay(text.replace(/\S/g, () => CHARS[Math.floor(Math.random() * CHARS.length)]));

    const id = setInterval(() => {
      step++;
      const progress = step / steps;
      const settled = Math.floor(progress * text.length);
      const result = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < settled) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setDisplay(result);

      if (step >= steps) {
        clearInterval(id);
        setDisplay(text);
      }
    }, interval);

    return () => clearInterval(id);
  }, [trigger, text, duration]);

  return display;
}

function ScramblePrice({ text, trigger, delay = 0 }: { text: string; trigger: boolean; delay?: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!trigger) { setGo(false); return; }
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [trigger, delay]);
  const display = useScrambleText(text, go, 800);
  return <span>{display}</span>;
}

function AnimatedCounter({ value, trigger }: { value: string; trigger: boolean }) {
  const [display, setDisplay] = useState("00");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!trigger) { setStarted(false); setDisplay("00"); return; }
    setStarted(true);
  }, [trigger]);

  useEffect(() => {
    if (!started) return;
    const steps = 8;
    let step = 0;
    const id = setInterval(() => {
      step++;
      if (step >= steps) { clearInterval(id); setDisplay(value); }
      else setDisplay(String(Math.floor(Math.random() * 10)) + String(Math.floor(Math.random() * 10)));
    }, 50);
    return () => clearInterval(id);
  }, [started, value]);

  return <span>{display}</span>;
}

function TypewriterLabel({ text, trigger, delay = 0 }: { text: string; trigger: boolean; delay?: number }) {
  const [display, setDisplay] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!trigger) { setDisplay(""); setShowCursor(false); return; }
    const startTimeout = setTimeout(() => {
      setShowCursor(true);
      let i = 0;
      const id = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) { clearInterval(id); setTimeout(() => setShowCursor(false), 1200); }
      }, 60);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [trigger, text, delay]);

  return (
    <span>
      {display}
      {showCursor && <span className="animate-blink ml-[1px] inline-block h-[1em] w-[2px] bg-brand align-middle" />}
    </span>
  );
}

function useMouseTexture(sectionRef: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });
  const raf = useRef(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
      });
    }
    function onLeave() { setPos((p) => ({ ...p, active: false })); }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, [sectionRef]);

  return pos;
}

export function AccessSection() {
  const { ref: sectionRef, inView } = useInView(0.1);
  const mouse = useMouseTexture(sectionRef as React.RefObject<HTMLElement>);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative mt-[80px] md:mt-[140px]"
    >
      {/* Cursor-reveal texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
        style={{
          opacity: mouse.active ? 1 : 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255, 212, 0, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 212, 0, 0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: `radial-gradient(circle 350px at ${mouse.x}px ${mouse.y}px, black 0%, transparent 70%)`,
          WebkitMaskImage: `radial-gradient(circle 350px at ${mouse.x}px ${mouse.y}px, black 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
        style={{
          opacity: mouse.active ? 1 : 0,
          background: `radial-gradient(circle 200px at ${mouse.x}px ${mouse.y}px, rgba(255, 212, 0, 0.06) 0%, transparent 100%)`,
        }}
      />

      {/* Header */}
      <div className="mx-6 border-x border-white/20 md:mx-[100px]">
        <div
          className="flex items-center justify-between px-8 py-4 transition-all duration-700"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <span className="font-mono text-base font-bold text-white">
            <TypewriterLabel text="Access" trigger={inView} delay={200} />
          </span>
          <span className="font-mono text-base font-bold text-brand">
            <AnimatedCounter value="04" trigger={inView} />
          </span>
        </div>
      </div>

      {/* Top line */}
      <div className="w-full overflow-hidden">
        <div
          className={cn(
            "h-px origin-left bg-white/40 transition-all duration-700 ease-out",
            inView && "line-pulse"
          )}
          style={{
            transform: inView ? "scaleX(1)" : "scaleX(0)",
            transitionDelay: "200ms",
          }}
        />
      </div>

      {/* Content grid */}
      <div className="mx-6 border-x border-white/20 md:mx-[100px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
          {/* Tier 00 */}
          <div
            className="flex flex-col gap-6 p-6 transition-all duration-700 md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "300ms",
            }}
          >
            <div className="flex items-center justify-between font-mono text-base">
              <span className="font-light text-white">Tier 00</span>
              <span
                className="font-bold text-brand transition-all duration-500"
                style={{
                  opacity: inView ? 1 : 0,
                  transitionDelay: "500ms",
                }}
              >
                Free
              </span>
            </div>
            <p className="font-mono text-[clamp(2.5rem,8vw,64px)] font-bold leading-[1.4] text-white">
              <ScramblePrice text="IDR 0" trigger={inView} delay={400} />
            </p>
            <p
              className="font-mono text-base font-light leading-[1.4] text-white transition-all duration-500"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(12px)",
                transitionDelay: "500ms",
              }}
            >
              No Commitment
            </p>
            <ul className="ml-6 flex list-disc flex-col gap-1 font-mono text-base font-light leading-[1.4] text-white">
              {[
                "Unfiltered news + impact analysis",
                "Economic calendar",
                "My Channel (founder broadcast)",
                "Public psychology primers",
              ].map((item, i) => (
                <li
                  key={item}
                  className="transition-all duration-500"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateX(0)" : "translateX(-16px)",
                    transitionDelay: `${600 + i * 100}ms`,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Animated vertical divider */}
          <div
            className="hidden origin-top bg-white/20 transition-all duration-700 ease-out md:block"
            style={{
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transitionDelay: "400ms",
            }}
          />

          {/* Tier 01 */}
          <div
            className="flex flex-col gap-6 bg-white p-6 text-black transition-all duration-700 md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "450ms",
            }}
          >
            <div className="flex items-center justify-between font-mono text-base">
              <span className="font-light">Tier 01</span>
              <span
                className="font-bold transition-all duration-500"
                style={{
                  opacity: inView ? 1 : 0,
                  transitionDelay: "600ms",
                }}
              >
                VIP+ Trader
              </span>
            </div>
            <p className="font-mono text-[clamp(2.5rem,8vw,64px)] font-bold leading-[1.4]">
              <ScramblePrice text="IDR 17.5M" trigger={inView} delay={500} />
            </p>
            <p
              className="font-mono text-base font-light leading-[1.4] transition-all duration-500"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(12px)",
                transitionDelay: "600ms",
              }}
            >
              Per year · Annual commitment
            </p>
            <ul className="ml-6 flex list-disc flex-col gap-1 font-mono text-base font-light leading-[1.4]">
              {[
                "Everything in Free",
                "Daily / weekly Trading Plan",
                "1v1 Consultation (founders)",
                "Full Education library",
                "Hashtag explorer (full)",
                "All collab channels",
              ].map((item, i) => (
                <li
                  key={item}
                  className="transition-all duration-500"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateX(0)" : "translateX(16px)",
                    transitionDelay: `${700 + i * 80}ms`,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="btn-pixel flex w-full items-center justify-center gap-4 bg-brand p-4 font-mono text-base font-bold text-black"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(16px)",
                transitionDelay: "1100ms",
              }}
            >
              Request Access
              <ArrowUpPixel className="h-4 w-4 rotate-90" />
            </Link>
            <p
              className="font-mono text-base font-light leading-[1.4] transition-all duration-500"
              style={{
                opacity: inView ? 1 : 0,
                transitionDelay: "1200ms",
              }}
            >
              Liability waiver required at signup.
              <br />
              No exceptions.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="w-full overflow-hidden">
        <div
          className="h-px origin-right bg-white/40 transition-all duration-700 ease-out"
          style={{
            transform: inView ? "scaleX(1)" : "scaleX(0)",
            transitionDelay: "800ms",
          }}
        />
      </div>
    </section>
  );
}
