"use client";

import { useEffect, useRef, useState } from "react";
import { faq } from "@/features/marketing/lib/data";
import { cn } from "@/lib/cn";

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

function ScrambleH2({ text, className, trigger }: { text: string; className: string; trigger: boolean }) {
  const display = useScrambleText(text, trigger);
  return <h2 className={className}>{display}</h2>;
}

function ScrambleH3({ text, className, trigger, delay = 0 }: { text: string; className: string; trigger: boolean; delay?: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!trigger) { setGo(false); return; }
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [trigger, delay]);
  const display = useScrambleText(text, go);
  return <h3 className={className}>{display}</h3>;
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

export function FaqSection() {
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
            <TypewriterLabel text="Frequent Interrogations" trigger={inView} delay={200} />
          </span>
          <span className="font-mono text-base font-bold text-brand">
            <AnimatedCounter value="03" trigger={inView} />
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
          {/* Left — hero question */}
          <div
            className="relative overflow-hidden p-6 transition-all duration-700 md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "300ms",
            }}
          >
            <div className="pointer-events-none absolute left-[-256px] top-[224px] h-[1073px] w-[1073px] blur-[2.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/figma/discord.png"
                alt=""
                className="h-full w-full object-cover transition-all duration-1000"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "scale(1)" : "scale(0.9)",
                  transitionDelay: "500ms",
                }}
              />
            </div>
            <div className="relative flex flex-col gap-2 text-white">
              <ScrambleH2
                text="Where's the Discord?"
                className="font-mono text-[clamp(2rem,8vw,64px)] font-bold leading-none"
                trigger={inView}
              />
              <div
                className="transition-all duration-500"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: "500ms",
                }}
              >
                <p className="font-mono text-2xl leading-[1.4]">
                  <span className="font-light">Nowhere. </span>
                  <span className="font-bold">4 Reasons.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Animated vertical divider */}
          <div
            className="hidden origin-top bg-white/20 transition-all duration-700 ease-out md:block"
            style={{
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transitionDelay: "400ms",
            }}
          />

          {/* Right — FAQ items */}
          <div className="flex flex-col">
            {faq.map((f, i) => (
              <div
                key={f.q}
                className={cn(
                  "flex flex-col gap-2 p-6 transition-all duration-700 md:p-12",
                  i < faq.length - 1 && "border-b border-white/20"
                )}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateX(0)" : "translateX(30px)",
                  transitionDelay: `${400 + i * 150}ms`,
                }}
              >
                <p className="font-mono text-base font-light leading-[1.4] text-white">
                  Reason {String(i + 1).padStart(2, "0")}
                </p>
                <ScrambleH3
                  text={f.q}
                  className="font-mono text-2xl font-bold leading-[1.4] text-white"
                  trigger={inView}
                  delay={500 + i * 150}
                />
                <p className="font-mono text-base font-light leading-[1.4] text-white">
                  {f.a}
                </p>
              </div>
            ))}
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
