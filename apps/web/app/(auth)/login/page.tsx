"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function useScrambleReveal(text: string, delay = 0) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      let step = 0;
      const steps = 12;
      setDisplay(
        text.replace(/\S/g, () => CHARS[Math.floor(Math.random() * CHARS.length)])
      );
      const id = setInterval(() => {
        step++;
        const settled = Math.floor((step / steps) * text.length);
        setDisplay(
          text
            .split("")
            .map((ch, i) =>
              ch === " " ? " " : i < settled ? text[i] : CHARS[Math.floor(Math.random() * CHARS.length)]
            )
            .join("")
        );
        if (step >= steps) {
          clearInterval(id);
          setDisplay(text);
        }
      }, 45);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return display;
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const heading1 = useScrambleReveal("Identify", 600);
  const heading2 = useScrambleReveal("Yourself", 750);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slow background drift
  useEffect(() => {
    let frame: number;
    let t = 0;
    function drift() {
      t += 0.001;
      if (imgRef.current) {
        const x = Math.sin(t) * 8;
        const y = Math.cos(t * 0.7) * 5;
        imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      }
      frame = requestAnimationFrame(drift);
    }
    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left — visual panel */}
      <div className="relative flex flex-col overflow-hidden px-6 pb-12 pt-20 md:px-12 md:pb-16">
        {/* Background image with drift */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src="/figma/login-bg.png"
            alt=""
            className="h-full w-full object-cover will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70" />
        </div>

        {/* Nav */}
        <div
          className="relative z-10 flex items-center justify-between transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-12px)",
          }}
        >
          <Link href="/" className="flex items-center gap-[7.78px]">
            <span className="font-mono text-base font-bold text-white">
              +vantage
            </span>
          </Link>
          <Link
            href="/"
            className="btn-pixel rounded-lg border border-white/20 bg-black/40 px-4 py-2 font-mono text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-brand hover:text-brand"
          >
            &larr; Return To Brief
          </Link>
        </div>

        {/* Section marker with animated line */}
        <div
          className="relative z-10 mt-4 flex items-baseline gap-3 font-mono text-sm transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transitionDelay: "200ms",
          }}
        >
          <span className="font-bold text-brand">00 /</span>
          <span
            className="h-px flex-1 bg-brand/40 transition-all duration-1000 ease-out"
            style={{
              transform: mounted ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transitionDelay: "400ms",
            }}
          />
          <span className="font-bold text-white">Login</span>
        </div>

        {/* Heading with scramble reveal */}
        <div className="relative z-10 mt-auto">
          <h1 className="font-sans text-[clamp(3rem,8vw,80px)] font-bold leading-[0.95] text-white">
            <span
              className="block transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "300ms",
              }}
            >
              {heading1 || " "}
            </span>
            <span
              className="block transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "450ms",
              }}
            >
              {heading2 || " "}
              <span className="text-brand">.</span>
            </span>
          </h1>
          <p
            className="mt-6 max-w-sm font-mono text-sm font-light leading-[1.5] text-white/60 transition-all duration-700"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "900ms",
            }}
          >
            Your session stays on this device. We don&apos;t track browsing
            history. Logging out clears everything.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-16 md:px-12">
        <LoginForm />
      </div>
    </main>
  );
}
