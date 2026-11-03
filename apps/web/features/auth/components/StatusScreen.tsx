import Link from "next/link";
import { cn } from "@/lib/cn";

type Action = { label: string; href?: string; onClick?: () => void; primary?: boolean };

const btn = "inline-flex h-11 items-center justify-center rounded-full px-6 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
const primary = "bg-brand text-black hover:opacity-90";
const secondary = "border border-white/[0.14] font-medium text-white hover:bg-raised";

/** Error / not-found / empty status message. `page` adds the logo shell for screens outside the app chrome. */
export function StatusScreen({
  code,
  eyebrow,
  title,
  body,
  digest,
  actions,
  page = false,
}: {
  code?: string;
  eyebrow: string;
  title: string;
  body: string;
  digest?: string;
  actions: Action[];
  page?: boolean;
}) {
  const card = (
    <div className="w-full max-w-md rounded-2xl bg-panel p-6 sm:p-8" data-testid="error-boundary">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{eyebrow}</p>
        {code && <span className="font-num text-[28px] font-semibold leading-none text-white/30">{code}</span>}
      </div>
      <h1 className="mt-3 text-[22px] font-semibold leading-7 text-white">{title}</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-white/55">{body}</p>
      {digest && <p className="mt-3 text-[12px] text-white/30">Ref {digest}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {actions.map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} className={cn(btn, a.primary ? primary : secondary)}>
              {a.label}
            </Link>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={cn(btn, a.primary ? primary : secondary)}>
              {a.label}
            </button>
          )
        )}
      </div>
    </div>
  );

  if (!page) return <div className="flex min-h-[60vh] items-center justify-center py-12">{card}</div>;

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-5 text-white sm:px-6">
      <Link href="/" aria-label="TradeVantage home" className="inline-flex self-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-vantage.png" alt="TradeVantage" className="h-7 w-auto" />
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">{card}</div>
    </main>
  );
}
