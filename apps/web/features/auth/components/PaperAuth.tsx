"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import "@/features/marketing/landing.css";
import { cn } from "@/lib/cn";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { Build } from "@/features/marketing/components/iso/Build";
import { Tilt } from "@/features/marketing/components/iso/Inspect";
import { Roll } from "@/features/marketing/components/Roll";

/** Field classes, the same as the Black Friday form. */
export const paperInput =
  "h-12 w-full rounded-[10px] border border-tv-stone bg-tv-white px-3.5 text-[16px] text-tv-ink outline-none transition-colors placeholder:text-tv-mute/70 hover:border-tv-graphite focus:border-tv-ink aria-[invalid=true]:border-tv-downpaper";
export const paperLabel = "block text-[15px] font-medium text-tv-ink";
export const paperHint = "mt-1.5 text-[13px] leading-[1.45] text-tv-mute";
export const paperErr = "mt-1.5 text-[13px] leading-[1.45] text-tv-downpaper";

/**
 * The auth pages on Paper: lockup header, then the Black Friday split. Left is the pitch
 * (eyebrow, headline, one line, the VIP card off the landing, whose chip is the screen's one
 * Signal), right is the form. On a phone
 * the form comes first and the pitch follows it, without the card.
 */
export function PaperAuthShell({
  eyebrow,
  title,
  copy,
  aside,
  figure = true,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  copy: React.ReactNode;
  aside?: React.ReactNode;
  figure?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={`tv-landing min-h-screen bg-tv-paper text-tv-ink ${tvFonts}`}>
      <noscript>
        <style>{".tv-figure [data-build]{opacity:1!important}"}</style>
      </noscript>
      <header className="px-4 md:px-8">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between md:h-[72px]">
          <Link href="/" className="flex items-center" aria-label="TradeVantage home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
          </Link>
          <Link href="/" className="tv-link py-1 text-[15px] text-tv-graphite">
            <span aria-hidden>←</span> Back to the site
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1240px] gap-y-14 px-4 pb-20 pt-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-x-20 md:px-10 md:pt-10">
        <aside className="order-2 md:order-1 md:sticky md:top-10 md:self-start">
          <div className="tv-eyebrow flex items-center gap-2.5 text-tv-mute">{eyebrow}</div>
          <h1 className="mt-4 text-[clamp(2rem,4.4vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.035em] md:mt-5">{title}</h1>
          <p className="mt-4 max-w-[30rem] text-[17px] leading-[1.55] text-tv-graphite md:mt-5">{copy}</p>
          {figure && (
            <Build immediate className="mt-8 hidden max-w-[320px] md:block">
              <div data-build="" data-dx="-60" data-dy="34" data-fade="" data-at="250">
                <Tilt>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/vip-card.svg" alt="The VIP+ member card, drawn on the desk" width={390} height={237} className="h-auto w-full" />
                </Tilt>
              </div>
            </Build>
          )}
          {aside}
        </aside>
        <section className="relative order-1 min-w-0 border-t border-tv-ink pt-6 md:order-2 md:max-w-[520px]">{children}</section>
      </div>
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
