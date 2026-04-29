"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  IconCheckBox,
  IconCloseSquare,
} from "@/features/marketing/components/icons";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function useScrambleText(text: string, trigger: boolean, duration = 600) {
  const [display, setDisplay] = useState(text);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (!trigger) {
      prevTrigger.current = false;
      return;
    }
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

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function ScrambleHeading({
  text,
  className,
  trigger,
}: {
  text: string;
  className: string;
  trigger: boolean;
}) {
  const display = useScrambleText(text, trigger);
  return <h2 className={className}>{display}</h2>;
}

function ScrambleH3({
  text,
  className,
  trigger,
  delay = 0,
}: {
  text: string;
  className: string;
  trigger: boolean;
  delay?: number;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!trigger) {
      setGo(false);
      return;
    }
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [trigger, delay]);
  const display = useScrambleText(text, go);
  return <h3 className={className}>{display}</h3>;
}

function RevealItem({
  children,
  delay,
  trigger,
  direction = "up",
}: {
  children: React.ReactNode;
  delay: number;
  trigger: boolean;
  direction?: "up" | "left" | "right";
}) {
  const transforms = {
    up: "translateY(24px)",
    left: "translateX(-24px)",
    right: "translateX(24px)",
  };
  return (
    <div
      className="transition-all duration-600 ease-out"
      style={{
        opacity: trigger ? 1 : 0,
        transform: trigger ? "translate(0)" : transforms[direction],
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({
  value,
  trigger,
  delay = 0,
}: {
  value: string;
  trigger: boolean;
  delay?: number;
}) {
  const [display, setDisplay] = useState("00");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setStarted(false);
      setDisplay("00");
      return;
    }
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [trigger, delay]);

  useEffect(() => {
    if (!started) return;
    const steps = 8;
    let step = 0;
    const id = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(id);
        setDisplay(value);
      } else {
        setDisplay(
          String(Math.floor(Math.random() * 10)) +
            String(Math.floor(Math.random() * 10))
        );
      }
    }, 50);
    return () => clearInterval(id);
  }, [started, value]);

  return <span>{display}</span>;
}

function TypewriterLabel({
  text,
  trigger,
  delay = 0,
}: {
  text: string;
  trigger: boolean;
  delay?: number;
}) {
  const [display, setDisplay] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setDisplay("");
      setShowCursor(false);
      return;
    }
    const startTimeout = setTimeout(() => {
      setShowCursor(true);
      let i = 0;
      const id = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          setTimeout(() => setShowCursor(false), 1200);
        }
      }, 60);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [trigger, text, delay]);

  return (
    <span>
      {display}
      {showCursor && (
        <span className="animate-blink ml-[1px] inline-block h-[1em] w-[2px] bg-brand align-middle" />
      )}
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
        setPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          active: true,
        });
      });
    }
    function onLeave() {
      setPos((p) => ({ ...p, active: false }));
    }

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

export function PositioningSection() {
  const { ref: sectionRef, inView } = useInView(0.15);
  const mouse = useMouseTexture(sectionRef as React.RefObject<HTMLElement>);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative mt-[80px] md:mt-[140px]"
    >
      {/* Cursor-reveal texture overlay */}
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
      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
        style={{
          opacity: mouse.active ? 1 : 0,
          background: `radial-gradient(circle 200px at ${mouse.x}px ${mouse.y}px, rgba(255, 212, 0, 0.06) 0%, transparent 100%)`,
        }}
      />
      {/* Outer frame with vertical borders */}
      <div className="mx-6 border-x border-white/20 md:mx-[100px]">
        {/* Header — Positioning left, 01 right */}
        <div
          className="flex items-center justify-between px-8 py-4 transition-all duration-700"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <span className="font-mono text-base font-bold text-white">
            <TypewriterLabel text="Positioning" trigger={inView} delay={200} />
          </span>
          <span className="font-mono text-base font-bold text-brand">
            <AnimatedCounter value="01" trigger={inView} />
          </span>
        </div>
      </div>

      {/* Top horizontal line — bleeds full width */}
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

      {/* 3-column grid inside the frame */}
      <div className="mx-6 border-x border-white/20 md:mx-[100px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr_1px_1fr]">
          {/* Col 1 — What this is */}
          <div
            className="relative flex min-h-[400px] flex-col gap-3 overflow-hidden bg-white p-6 transition-all duration-700 md:min-h-[560px] md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "300ms",
            }}
          >
            <ScrambleHeading
              text="What this is"
              className="font-mono text-2xl font-bold leading-none text-black md:text-[36px]"
              trigger={inView}
            />
            <RevealItem delay={500} trigger={inView}>
              <p className="font-mono text-base font-light leading-[1.4] text-black">
                A market radar powered by AI and professionals, created for
                traders and investors who already know what they&apos;re doing.
              </p>
            </RevealItem>
            <div className="pointer-events-none absolute left-1/2 top-[193px] h-[364px] w-[364px] -translate-x-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/figma/what-this-is.png"
                alt=""
                className="h-full w-full object-cover transition-all duration-1000"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "scale(1) rotate(0deg)" : "scale(0.8) rotate(-3deg)",
                  transitionDelay: "600ms",
                }}
              />
            </div>
          </div>

          {/* Animated vertical divider 1 */}
          <div
            className="hidden origin-top bg-white/20 transition-all duration-700 ease-out md:block"
            style={{
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transitionDelay: "400ms",
            }}
          />

          {/* Col 2 — Who this is not for */}
          <div
            className="flex flex-col gap-6 p-6 transition-all duration-700 md:gap-9 md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "450ms",
            }}
          >
            <ScrambleH3
              text="Who this is not for"
              className="font-mono text-2xl font-bold text-white"
              trigger={inView}
              delay={400}
            />
            <ul className="flex flex-col gap-4">
              {["Beginners", "Gamblers", "Hobbyists"].map((item, i) => (
                <RevealItem key={item} delay={600 + i * 200} trigger={inView} direction="left">
                  <li className="flex items-center gap-2">
                    <IconCloseSquare className="h-6 w-6 shrink-0 text-blood-bright" />
                    <span className="font-mono text-base font-light leading-[1.4] text-blood-bright line-through">
                      {item}
                    </span>
                  </li>
                </RevealItem>
              ))}
              <RevealItem delay={1200} trigger={inView}>
                <li className="font-mono text-base font-light leading-[1.4] text-white">
                  We don&apos;t soften this.
                  <br />
                  Onboarding is a filter, not a funnel.
                </li>
              </RevealItem>
            </ul>
          </div>

          {/* Animated vertical divider 2 */}
          <div
            className="hidden origin-bottom bg-white/20 transition-all duration-700 ease-out md:block"
            style={{
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transitionDelay: "500ms",
            }}
          />

          {/* Col 3 — Who this is for */}
          <div
            className="flex flex-col gap-6 p-6 transition-all duration-700 md:gap-9 md:p-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transitionDelay: "600ms",
            }}
          >
            <ScrambleH3
              text="Who this is for"
              className="font-mono text-2xl font-bold text-white"
              trigger={inView}
              delay={550}
            />
            <ul className="flex flex-col gap-4">
              {[
                "Experienced market participants leveling up their edge.",
                "Traders who need a second-opinion copilot for blind-spot coverage.",
                null,
              ].map((item, i) => (
                <RevealItem key={i} delay={750 + i * 200} trigger={inView} direction="right">
                  <li className="flex items-start gap-4">
                    <IconCheckBox className="h-6 w-6 shrink-0 text-brand" />
                    {item ? (
                      <span className="font-mono text-base font-light leading-[1.4] text-white">
                        {item}
                      </span>
                    ) : (
                      <span className="font-mono text-base font-light leading-[1.4] text-white">
                        Anyone who wants to activate{" "}
                        <span className="text-brand">Six Eyes</span> on the
                        market.
                      </span>
                    )}
                  </li>
                </RevealItem>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom horizontal line — bleeds full width */}
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
