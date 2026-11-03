"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import "@/features/marketing/landing.css";
import { cn } from "@/lib/cn";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { Roll } from "@/features/marketing/components/Roll";

/** Field classes, the same as the Black Friday form. */
export const paperInput =
  "h-12 w-full rounded-[10px] border border-tv-stone bg-tv-white px-3.5 text-[16px] text-tv-ink outline-none transition-colors placeholder:text-tv-mute/70 hover:border-tv-graphite focus:border-tv-ink aria-[invalid=true]:border-tv-downpaper";
export const paperLabel = "block text-[15px] font-medium text-tv-ink";
export const paperHint = "mt-1.5 text-[13px] leading-[1.45] text-tv-mute";
export const paperErr = "mt-1.5 text-[13px] leading-[1.45] text-tv-downpaper";

type Scene = "login" | "signup" | "verify" | "waiver";

/** One plate per auth page, each carrying the screen's one Signal (the flag, the lamp, the lit window). */
const PLATES: Record<Scene, { src: string; alt: string; caption: string }> = {
  login: { src: "/auth/terrain.webp", alt: "A terrain block whose ridgeline traces a price chart, a yellow flag on the highest swing", caption: "Plate 01 / Market structure" },
  signup: { src: "/auth/desk-night.webp", alt: "A trader's desk drawn in hairlines, two charts on screen, the lamp in yellow", caption: "Plate 02 / The desk at night" },
  verify: { src: "/auth/night-floor.webp", alt: "A city grid at night seen from a high window, one window lit yellow", caption: "Plate 03 / One light on" },
  waiver: { src: "/auth/night-floor.webp", alt: "A city grid at night seen from a high window, one window lit yellow", caption: "Plate 03 / One light on" },
};

/**
 * The auth pages: a full-height Desk plate on the left with the headline set at its foot (the
 * composition of the old auth pages), the form on Paper on the right. The plate wipes up on load
 * and drifts slowly; reduced motion holds it still. On a phone the plate is a strip under the
 * lockup, the headline follows it, then the form.
 */
export function PaperAuthShell({
  eyebrow,
  title,
  copy,
  aside,
  scene = "login",
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  copy: React.ReactNode;
  /** Shown above the form on desktop (the sign-up steps). */
  aside?: React.ReactNode;
  scene?: Scene;
  children: React.ReactNode;
}) {
  const plate = PLATES[scene];
  return (
    <main className={`tv-landing min-h-svh bg-tv-paper text-tv-ink md:grid md:grid-cols-2 ${tvFonts}`}>
      <aside className="tv-on-desk relative isolate flex flex-col overflow-hidden bg-tv-desk px-4 pb-8 pt-4 text-tv-paper sm:px-6 md:sticky md:top-0 md:h-svh md:min-h-[640px] md:px-10 md:pb-8 md:pt-7">
        <header className="flex h-10 items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="TradeVantage home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-desk.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
          </Link>
          <Link href="/" className="tv-link py-1 text-[15px] text-tv-mutedesk hover:text-tv-paper">
            <span aria-hidden>←</span> Back to the site
          </Link>
        </header>
        <div className="tv-plate relative -mx-4 mt-4 h-[210px] sm:-mx-6 md:absolute md:inset-0 md:-z-10 md:m-0 md:h-auto">
          <div className="tv-plate-frame h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plate.src} alt={plate.alt} width={1440} height={2160} fetchPriority="high" className="tv-plate-img h-full w-full object-cover object-[50%_72%]" />
          </div>
        </div>
        <div className="mt-6 md:mt-auto">
          <p className="tv-eyebrow lv-in flex items-center gap-3 text-tv-mutedesk">
            <span aria-hidden className="tv-rule h-px w-8 bg-tv-mutedesk" />
            {eyebrow}
          </p>
          <h1 className="lv-in mt-4 text-[clamp(2.75rem,6.2vw,5.75rem)] font-semibold leading-[0.92] tracking-[-0.045em] [--i:1] md:mt-5">{title}</h1>
          <p className="lv-in mt-4 max-w-[27rem] text-[16px] leading-[1.55] text-tv-mutedesk [--i:2] md:mt-5 md:text-[17px]">{copy}</p>
        </div>
        <p className="tv-eyebrow hidden items-center gap-3 pt-8 text-tv-mutedesk md:flex">
          {plate.caption}
          <span aria-hidden className="h-px flex-1 bg-tv-line" />
          TradeVantage
        </p>
      </aside>
      <section className="flex min-w-0 items-center justify-center px-4 py-12 sm:px-6 md:px-12 md:py-16">
        <div className="relative w-full max-w-[440px]">
          {aside}
          {children}
        </div>
      </section>
    </main>
  );
}

export function PaperField({ id, label, hint, children }: { id: string; label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={paperLabel}>
        {label}
      </label>
      {children}
      {hint && <p className={paperHint}>{hint}</p>}
    </div>
  );
}

/** A field with the focus hairline drawing under it, a tick once valid, and Show/Hide on passwords. */
export function PaperInput({ valid = false, type, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean }) {
  const [shown, setShown] = useState(false);
  const pw = type === "password";
  return (
    <div className="bf-field relative mt-2">
      <input {...rest} type={pw && shown ? "text" : type} className={cn(paperInput, pw ? "pr-[96px]" : "pr-10", className)} />
      <span aria-hidden className="bf-line" />
      <svg
        aria-hidden
        data-on={(valid && !rest["aria-invalid"]) || undefined}
        viewBox="0 0 14 14"
        className={cn("bf-tick pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2", pw ? "right-[72px]" : "right-3.5")}
      >
        <path d="M2 7.5l3.2 3L12 3.5" pathLength={1} fill="none" stroke="#111214" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
      {pw && (
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 h-9 w-[58px] -translate-y-1/2 rounded-[8px] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-tv-mute transition-colors hover:text-tv-ink"
        >
          {shown ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}

/** Ink (or hairline) button with a busy state: the label changes and a small ring turns. */
export function PaperButton({
  busy,
  label,
  busyLabel,
  variant = "ink",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy: boolean; label: string; busyLabel: string; variant?: "ink" | "line" }) {
  return (
    <button
      {...rest}
      disabled={busy || rest.disabled}
      aria-busy={busy}
      className={cn("tv-btn", variant === "ink" ? "tv-btn-ink" : "tv-btn-line", busy ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-35", className)}
    >
      {busy ? (
        <>
          <Spinner />
          {busyLabel}
        </>
      ) : (
        <>
          <Roll label={label} />
          {variant === "ink" && (
            <span aria-hidden className="tv-arrow">
              →
            </span>
          )}
        </>
      )}
    </button>
  );
}

function Spinner() {
  return <span aria-hidden className="h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-t-transparent motion-safe:animate-spin" />;
}

/** One status panel (pending, checking, confirmed, failed) for the verify pages. */
export function VerifyStatus({
  eyebrow,
  title,
  busy,
  failed,
  children,
}: {
  eyebrow: string;
  title: string;
  busy?: boolean;
  failed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div role="status" className="lv-in">
      <p className={cn("tv-eyebrow flex items-center gap-2.5", failed ? "text-tv-downpaper" : "text-tv-mute")}>
        {busy && <Spinner />}
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

/** PaperButton wired to the enclosing form's pending state. */
export function PaperSubmit(props: { label: string; busyLabel: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <PaperButton type="submit" busy={pending} {...props} />;
}
