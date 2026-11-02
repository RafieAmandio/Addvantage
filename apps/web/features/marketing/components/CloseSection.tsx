"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Roll } from "@/features/marketing/components/Roll";
import { Magnet } from "@/features/marketing/components/Magnet";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { SESSIONS, countdown, hhmm, marketNow, wall } from "@/features/marketing/lib/sessions";
import { ClockFigure } from "@/features/marketing/components/iso/Figures";
import { useNow } from "@/features/marketing/lib/use-now";

const read = marketNow;

function Meta({ r }: { r: Read }) {
  return (
    <p className="tv-eyebrow flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-tv-stone pb-4">
      <span>Request access</span>
      <span className="flex items-center gap-2 tabular-nums" aria-live="off">
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-tv-ink",
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
      <p className="tv-eyebrow text-tv-mute">{r ? r.headline.text : "Reading the session clock"}</p>
      <p className="mt-3 flex flex-wrap gap-x-[0.3em] text-[clamp(2.6rem,6.4vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.04em] tabular-nums">
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
    <ul className="grid grid-cols-1 border-y border-tv-stone font-mono text-[12px] uppercase tracking-[0.06em] sm:grid-cols-3">
      {rows.map((s) => (
        <li key={s.name} className="flex items-center justify-between gap-3 border-b border-tv-stone py-3 last:border-b-0 sm:flex-col sm:items-start sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
          <span className="flex items-center gap-2 font-medium">
            <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[10px]", s.open ? "bg-tv-ink text-tv-paper" : "border border-tv-ink/50")}>{s.open ? "Open" : "Shut"}</span>
            {s.name} <span className="tabular-nums">{s.local}</span>
          </span>
          <span className="tabular-nums text-tv-mute">{r ? (s.open ? `Closes ${hhmm(s.flip, "Asia/Jakarta")} WIB` : `Opens ${hhmm(s.nextOpen, "Asia/Jakarta")} WIB`) : ""}</span>
        </li>
      ))}
    </ul>
  );
}

/** Each session's open and close on the 24 h WIB dial, for the clock. */
function dial(now: number) {
  const utcH = new Date(now).getUTCHours();
  return SESSIONS.map((s) => {
    const off = (wall(now, s.tz).h - utcH + 24) % 24; // the session city's UTC offset today
    const wib = (h: number) => (h - off + 7 + 24) % 24;
    return { name: s.name, from: wib(s.open), to: wib(s.close), open: false };
  });
}

/** The ask, on Paper, with the market's own clock ticking beside it: the session open now is the one yellow arc. */
export function CloseSection() {
  const now = useNow();
  const r = now === null ? null : read(now);
  const w = now === null ? null : wall(now, "Asia/Jakarta");
  const arcs = dial(now ?? Date.UTC(2026, 0, 5, 3)).map((a, i) => ({ ...a, open: !!r?.sessions[i]?.open }));
  return (
    <section id="request" className="relative z-10 border-t border-tv-stone bg-tv-paper text-tv-ink">
      <div className="mx-auto flex min-h-[92svh] max-w-[1240px] flex-col gap-10 px-4 py-12 sm:px-6 md:min-h-[100svh] md:px-10 md:py-16">
        <Meta r={r} />
        <div className="my-auto grid gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center md:gap-10">
          <div>
            <h2 className="text-[clamp(2.9rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              <Scramble text="Stop copying" duration={800} className="block whitespace-nowrap" />
              <Scramble text="signals." delay={200} duration={700} className="block" />
            </h2>
            <div className="mt-8 flex w-full max-w-[520px] flex-col gap-3 sm:flex-row">
              <Magnet>
                <Link href="/signup" className="tv-btn tv-btn-ink w-full px-8 sm:w-auto">
                  <Roll label="Request access" />
                  <span aria-hidden className="tv-arrow">
                    →
                  </span>
                </Link>
              </Magnet>
              <Link href="/login" className="tv-btn tv-btn-line px-8">
                <Roll label="Log in" />
              </Link>
            </div>
            <div className="mt-12">
              <Countdown r={r} now={now} />
            </div>
          </div>
          <ClockFigure hour={w ? w.h + w.m / 60 : null} arcs={arcs} className="mx-auto w-full max-w-[420px]" />
        </div>
        <Sessions r={r} />
      </div>
    </section>
  );
}
