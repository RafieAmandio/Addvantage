"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { TriangleDown, TriangleUp } from "@/features/marketing/components/icons";

const DIGITS = "0123456789.+-";

interface Props {
  sym: string;
  val: string;
  chg: string;
  dir: "up" | "down";
}

export function TickerItem({ sym, val, chg, dir }: Props) {
  const [hovered, setHovered] = useState(false);
  const [displayVal, setDisplayVal] = useState(val);
  const [displayChg, setDisplayChg] = useState(chg);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!hovered) {
      setDisplayVal(val);
      setDisplayChg(chg);
      return;
    }

    let step = 0;
    const total = 6;
    const id = setInterval(() => {
      step++;
      if (step >= total) {
        clearInterval(id);
        setDisplayVal(val);
        setDisplayChg(chg);
        return;
      }
      setDisplayVal(
        val
          .split("")
          .map((ch) =>
            /[0-9]/.test(ch)
              ? DIGITS[Math.floor(Math.random() * 10)]
              : ch
          )
          .join("")
      );
      setDisplayChg(
        chg
          .split("")
          .map((ch) =>
            /[0-9]/.test(ch)
              ? DIGITS[Math.floor(Math.random() * 10)]
              : ch
          )
          .join("")
      );
    }, 45);

    return () => {
      clearInterval(id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hovered, val, chg]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex min-w-[220px] shrink-0 items-center justify-center gap-[11px] whitespace-nowrap rounded-[10px] bg-white/10 px-5 py-4 backdrop-blur-[8.65px] transition-shadow duration-300",
        hovered && "shadow-[0_0_12px_rgba(255,212,0,0.15)]"
      )}
    >
      <span className="font-mono text-base font-bold text-white">{sym}</span>
      <span className="font-mono text-base tabular-nums text-white">
        {displayVal}
      </span>
      {dir === "up" ? (
        <TriangleUp className="h-[10px] w-[15px] text-brand" />
      ) : (
        <TriangleDown className="h-[10px] w-[15px] text-blood-bright" />
      )}
      <span
        className={cn(
          "font-mono text-base tabular-nums",
          dir === "up" ? "text-brand" : "text-blood-bright"
        )}
      >
        {displayChg}
      </span>
    </div>
  );
}
