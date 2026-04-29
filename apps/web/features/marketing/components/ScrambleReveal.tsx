"use client";

import { useEffect, useState, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

interface Props {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScrambleReveal({ text, delay = 0, duration = 800, className }: Props) {
  const [display, setDisplay] = useState(() => text.replace(/\S/g, " "));
  const started = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;

      const chars = text.split("");
      const totalFrames = Math.ceil(duration / 30);
      let frame = 0;

      const id = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;

        const next = chars.map((ch, i) => {
          if (ch === " ") return " ";
          const charThreshold = i / chars.length;
          if (progress > charThreshold + 0.3) return ch;
          if (progress > charThreshold) return CHARS[Math.floor(Math.random() * CHARS.length)];
          return " ";
        });

        setDisplay(next.join(""));

        if (frame >= totalFrames) {
          clearInterval(id);
          setDisplay(text);
        }
      }, 30);

      return () => clearInterval(id);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, duration]);

  return <span className={className}>{display}</span>;
}
