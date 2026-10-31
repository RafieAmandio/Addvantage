import Link from "next/link";
import { cn } from "@/lib/cn";

/** Shared classes for auth and public forms. */
export const authLabel = "block text-[13px] font-medium text-white/70";
export const authInput =
  "mt-2 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";
export const authPrimary =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-full bg-brand px-6 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
export const authSecondary =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/[0.14] px-6 text-[14px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
export const authEyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** Calm centred page for screens without the app shell: logo top-left, one card. */
export function AuthShell({
  children,
  width = "md",
  footer,
}: {
  children: React.ReactNode;
  width?: "md" | "lg" | "xl";
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-5 text-white sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="TradeVantage home" className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-vantage.png" alt="TradeVantage" className="h-7 w-auto" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-10">
        <div
          className={cn(
            "w-full",
            width === "md" ? "max-w-md" : width === "lg" ? "max-w-2xl" : "max-w-3xl"
          )}
        >
          <div className="rounded-2xl bg-panel p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-5 text-center text-[13px] text-white/55">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
