"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Roll } from "@/features/marketing/components/HeroSection";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import {
  SESSIONS,
  countdown,
  fxWeekend,
  hhmm,
  isOpen,
  nextFlip,
  wall,
} from "@/features/marketing/lib/sessions";

const H = 3_600_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** The next thing the market does: a session opening or closing, or the weekend ending. */
function read(now: number) {
  const sessions = SESSIONS.map((s) => {
    const open = isOpen(s, now);
    const flip = nextFlip(s, now);
    return {
      name: s.name,
      open,
      flip,
      local: hhmm(now, s.tz),
      nextOpen: open ? nextFlip(s, flip) : flip,
    };
  });
  let headline: { text: string; at: number };
  if (fxWeekend(now)) {
    let t = Math.floor(now / H) * H + H;
    while (fxWeekend(t)) t += H;
    headline = { text: "FX reopens in", at: t };
  } else {
    const n = [...sessions].sort((a, b) => a.flip - b.flip)[0]!;
    headline = {
      text: `${n.name} ${n.open ? "closes" : "opens"} in`,
      at: n.flip,
    };
  }
  const w = wall(now, "Asia/Jakarta");
  return { wib: `${pad(w.h)}:${pad(w.m)}:${pad(w.s)}`, sessions, headline };
}

/** Ticks every second after mount; null on the server so it never guesses a time. */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Meta({ r }: { r: Read }) {
  return (
    <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-black/25 pb-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] md:text-xs">
      <span>Request access</span>
      <span className="flex items-center gap-2 tabular-nums" aria-live="off">
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-black",
            r && r.sessions.some((s) => s.open) && "lv-live",
          )}
          aria-hidden
        />
        {r ? `Jakarta ${r.wib} WIB` : "Jakarta, UTC+7"}
      </span>
    </p>
  );
}

type Read = ReturnType<typeof read> | null;

/** The gimmick: the next session open or close, counting down to the second. */
function Countdown({ r, now }: { r: Read; now: number | null }) {
  const parts = r && now !== null ? countdown(r.headline.at - now).split(" ") : ["--H", "--M", "--S"];
  return (
    <div aria-live="off" className="font-mono">
      <p className="text-sm font-bold uppercase tracking-[0.12em] md:text-base">{r ? r.headline.text : "Reading the session clock"}</p>
      <p className="mt-2 flex flex-wrap gap-x-[0.3em] text-[clamp(2.6rem,7.2vw,6.25rem)] font-bold leading-[0.95] tracking-[-0.04em] tabular-nums">
        {parts.map((x, i) => (
          <span key={i === 2 ? x : i} className={cn("whitespace-nowrap", i === 2 && "lv-in")}>
            {x.slice(0, -1)}
            <span className="text-[0.45em] tracking-normal">{x.slice(-1)}</span>
          </span>
        ))}
      </p>
    </div>
  );
}

function Sessions({ r }: { r: Read }) {
  const rows = r?.sessions ?? SESSIONS.map((s) => ({ name: s.name, open: false, local: "--:--", nextOpen: 0, flip: 0 }));
  return (
    <ul className="grid grid-cols-1 border-y border-black/25 font-mono text-[12px] uppercase tracking-[0.06em] sm:grid-cols-3">
      {rows.map((s) => (
        <li key={s.name} className="flex items-center justify-between gap-3 border-b border-black/15 py-3 last:border-b-0 sm:flex-col sm:items-start sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
          <span className="flex items-center gap-2 font-bold">
            <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[10px]", s.open ? "bg-black text-brand" : "border border-black/50")}>{s.open ? "Open" : "Shut"}</span>
            {s.name} <span className="tabular-nums">{s.local}</span>
          </span>
          <span className="tabular-nums text-black/75">{r ? (s.open ? `Closes ${hhmm(s.flip, "Asia/Jakarta")} WIB` : `Opens ${hhmm(s.nextOpen, "Asia/Jakarta")} WIB`) : ""}</span>
        </li>
      ))}
    </ul>
  );
}

/** The ask, on a solid yellow block, with the market's own clock ticking on it. */
export function CloseSection() {
  const now = useNow();
  const r = now === null ? null : read(now);
  return (
    <section id="request" className="relative z-10 bg-brand text-black">
      <div className="mx-auto flex min-h-[92svh] max-w-[1240px] flex-col gap-10 px-4 py-10 sm:px-6 md:min-h-[100svh] md:px-10 md:py-14">
        <Meta r={r} />
        <div className="my-auto grid gap-12 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:items-end md:gap-10">
          <div>
            <h2 className="text-[clamp(2.9rem,7.4vw,6.25rem)] font-bold leading-[0.92] tracking-[-0.035em]">
              <Scramble text="Stop copying" duration={800} className="block whitespace-nowrap" />
              <Scramble text="signals." delay={200} duration={700} className="block" />
            </h2>
            <div className="mt-8 flex w-full max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-5">
              <Link href="/signup" className="btn-pixel flex-1 rounded-[10px] bg-black px-8 py-4 text-center font-mono text-base font-bold text-brand hover:!shadow-[3px_3px_0_0_#0A0A0A,6px_6px_0_0_rgba(10,10,10,0.3)]">
                <Roll label="Request access" />
              </Link>
              <Link href="/login" className="btn-pixel flex-1 rounded-[10px] border border-black px-8 py-4 text-center font-mono text-base font-bold text-black hover:!shadow-[3px_3px_0_0_#0A0A0A,6px_6px_0_0_rgba(10,10,10,0.3)]">
                <Roll label="Log in" />
              </Link>
            </div>
          </div>
          <Countdown r={r} now={now} />
        </div>
        <Sessions r={r} />
      </div>
    </section>
  );
}
