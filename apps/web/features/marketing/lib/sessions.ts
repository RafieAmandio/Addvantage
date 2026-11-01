/**
 * Market sessions in their own cities' clocks, so daylight saving moves them
 * by itself. All three zones sit on whole-hour offsets, which lets the next
 * open or close be found by walking whole UTC hours.
 */
export const SESSIONS = [
  { name: "Tokyo", tz: "Asia/Tokyo", open: 9, close: 18 },
  { name: "London", tz: "Europe/London", open: 8, close: 17 },
  { name: "New York", tz: "America/New_York", open: 8, close: 17 },
] as const;
export type Session = (typeof SESSIONS)[number];

const H = 3_600_000;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fmts = new Map<string, Intl.DateTimeFormat>();

/** Wall clock in a zone: weekday (0 = Monday), hour, minute, second. */
export function wall(ms: number, tz: string) {
  let f = fmts.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    fmts.set(tz, f);
  }
  const parts = f.formatToParts(ms);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { wd: DAYS.indexOf(get("weekday")), h: Number(get("hour")), m: Number(get("minute")), s: Number(get("second")) };
}

export function isOpen(s: Session, ms: number) {
  const w = wall(ms, s.tz);
  return w.wd < 5 && w.h >= s.open && w.h < s.close;
}

/** The next moment the session opens or closes. */
export function nextFlip(s: Session, ms: number) {
  const now = isOpen(s, ms);
  let t = Math.floor(ms / H) * H + H;
  for (let i = 0; i < 24 * 8; i++, t += H) if (isOpen(s, t) !== now) return t;
  return t;
}

/** FX trades from Sunday 17:00 to Friday 17:00 New York time. */
export function fxWeekend(ms: number) {
  const w = wall(ms, "America/New_York");
  return (w.wd === 4 && w.h >= 17) || w.wd === 5 || (w.wd === 6 && w.h < 17);
}

const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (ms: number, tz: string) => {
  const w = wall(ms, tz);
  return `${pad(w.h)}:${pad(w.m)}`;
};

export function countdown(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86_400);
  const h = Math.floor((t % 86_400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  return `${d ? `${d}D ` : ""}${h}H ${pad(m)}M ${pad(t % 60)}S`;
}

/** Every session's state now, and the next thing the market does: a session opening or closing, or the FX weekend ending. */
export function marketNow(now: number) {
  const sessions = SESSIONS.map((s) => {
    const open = isOpen(s, now);
    const flip = nextFlip(s, now);
    return { name: s.name, open, flip, local: hhmm(now, s.tz), nextOpen: open ? nextFlip(s, flip) : flip };
  });
  let headline: { text: string; at: number };
  if (fxWeekend(now)) {
    let t = Math.floor(now / H) * H + H;
    while (fxWeekend(t)) t += H;
    headline = { text: "FX reopens in", at: t };
  } else {
    const n = [...sessions].sort((a, b) => a.flip - b.flip)[0]!;
    headline = { text: `${n.name} ${n.open ? "closes" : "opens"} in`, at: n.flip };
  }
  const w = wall(now, "Asia/Jakarta");
  return { wib: `${pad(w.h)}:${pad(w.m)}:${pad(w.s)}`, sessions, headline };
}
