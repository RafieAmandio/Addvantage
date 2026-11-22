"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import "@/features/marketing/landing.css";
import { cn } from "@/lib/cn";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { Roll } from "@/features/marketing/components/Roll";
import { GRAIN_URL } from "@/features/marketing/components/iso/Iso";
import { HeroDesk } from "@/features/marketing/components/HeroDesk";
import type { HeroData } from "@/features/marketing/lib/landing";
import hero from "../hero-desk.json";

/** The landing hero desk's data, snapshotted from the landing sample so the auth bundle skips the full candle file. */
const HERO = hero as unknown as HeroData;

/** Field classes, the same as the Black Friday form. */
export const paperInput =
  "h-12 w-full rounded-[10px] border border-tv-stone bg-tv-white px-3.5 text-[16px] text-tv-ink outline-none transition-colors placeholder:text-tv-mute/70 hover:border-tv-graphite focus:border-tv-ink aria-[invalid=true]:border-tv-downpaper";
export const paperLabel = "block text-[15px] font-medium text-tv-ink";
export const paperHint = "mt-1.5 text-[13px] leading-[1.45] text-tv-mute";
export const paperErr = "mt-1.5 text-[13px] leading-[1.45] text-tv-downpaper";

/**
 * The auth pages, Retool-plain: the form on white on the left, nothing but its own heading; the
 * landing's isometric desk on Paper filling the right half, the exchange partner at its foot.
 * On a phone the desk is left out.
 */
export function PaperAuthShell({ aside, children }: { /** Shown above the form on desktop (the sign-up steps). */ aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className={`tv-landing min-h-svh bg-tv-white text-tv-ink md:grid md:grid-cols-2 ${tvFonts}`}>
      <section className="flex min-h-svh min-w-0 flex-col px-4 pb-10 pt-4 sm:px-6 md:px-12 md:pt-6">
        <header className="flex h-10 items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="TradeVantage home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
          </Link>
          <Link href="/" className="tv-link py-1 text-[15px] text-tv-graphite hover:text-tv-ink">
            <span aria-hidden>←</span> Back to the site
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="lv-in relative w-full max-w-[400px]">
            {aside}
            {children}
          </div>
        </div>
      </section>
      <aside
        style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }}
        className="tv-grain relative hidden flex-col overflow-hidden border-l border-tv-stone bg-tv-paper md:sticky md:top-0 md:flex md:h-svh"
      >
        <figure className="flex flex-1 items-center justify-center px-4">
          <HeroDesk d={HERO} className="w-full" />
        </figure>
        <p className="flex items-center justify-center gap-4 border-t border-tv-stone py-6">
          <span className="tv-eyebrow text-tv-mute">Exchange partner</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/partners/bingx.svg" alt="BingX" width={83} height={24} className="tv-partner h-6 w-auto" />
        </p>
      </aside>
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
