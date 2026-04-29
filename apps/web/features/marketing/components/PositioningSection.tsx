"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  IconCheckBox,
  IconCloseSquare,
  SectionHeader,
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
}: {
  children: React.ReactNode;
  delay: number;
  trigger: boolean;
}) {
  return (
    <div
      className="transition-all duration-500"
      style={{
        opacity: trigger ? 1 : 0,
        transform: trigger ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function PositioningSection() {
  const { ref: sectionRef, inView } = useInView(0.15);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="mt-[140px] flex flex-col items-center gap-4"
    >
      <div
        className="transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(30px)",
        }}
      >
        <SectionHeader num="01" label="Positioning" />
      </div>
      <div
        className="w-full border-y border-white transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(40px)",
          transitionDelay: "200ms",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="relative flex h-full min-h-[560px] flex-col gap-3 overflow-hidden border-x border-white bg-white p-12">
            <ScrambleHeading
              text="What this is"
              className="font-mono text-[36px] font-bold leading-none text-black"
              trigger={inView}
            />
            <RevealItem delay={300} trigger={inView}>
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
                  transform: inView ? "scale(1)" : "scale(0.9)",
                  transitionDelay: "400ms",
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-9 p-12">
            <ScrambleH3
              text="Who this is not for"
              className="font-mono text-2xl font-bold text-white"
              trigger={inView}
              delay={200}
            />
            <ul className="flex flex-col gap-4">
              {["Beginners", "Gamblers", "Hobbyists"].map((item, i) => (
                <RevealItem key={item} delay={400 + i * 150} trigger={inView}>
                  <li className="flex items-center gap-2">
                    <IconCloseSquare className="h-6 w-6 shrink-0 text-blood-bright" />
                    <span className="font-mono text-base font-light leading-[1.4] text-blood-bright line-through">
                      {item}
                    </span>
                  </li>
                </RevealItem>
              ))}
              <RevealItem delay={850} trigger={inView}>
                <li className="font-mono text-base font-light leading-[1.4] text-white">
                  We don&apos;t soften this.
                  <br />
                  Onboarding is a filter, not a funnel.
                </li>
              </RevealItem>
            </ul>
          </div>

          <div className="flex flex-col gap-9 border-x border-white p-12">
            <ScrambleH3
              text="Who this is for"
              className="font-mono text-2xl font-bold text-white"
              trigger={inView}
              delay={300}
            />
            <ul className="flex flex-col gap-4">
              {[
                "Experienced market participants leveling up their edge.",
                "Traders who need a second-opinion copilot for blind-spot coverage.",
                null,
              ].map((item, i) => (
                <RevealItem key={i} delay={500 + i * 150} trigger={inView}>
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
    </section>
  );
}
