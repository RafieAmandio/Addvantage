"use client";

import { isMockMode } from "@/lib/config/public";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canOpenRoute } from "@tradevantage/shared";
import { useAppState, isPaid, type Tier } from "@/lib/state";
import { apiGet } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

interface ReferralPartner {
  id: string;
  name: string;
  category: string;
  tagline: string;
  url: string;
  iconUrl: string | null;
  sortOrder: number;
}

interface NavEntry {
  label: string;
  href: string;
  group: string;
  icon: string;
  /** Shown with a SOON tag; the route renders a coming-soon page. */
  soon?: boolean;
  /** One-line header tagline for the route. */
  tagline: string;
}

const nav: NavEntry[] = [
  { label: "Home", href: "/app", group: "main", icon: "home", tagline: "Your desk: consensus, calendar and the active plan." },
  { label: "Today's Brief", href: "/app/brief", group: "main", icon: "brief", tagline: "What moved overnight and what matters before the open." },
  { label: "News", href: "/app/news", group: "main", icon: "news", tagline: "Market-moving news with what it means for price." },
  { label: "Calendar", href: "/app/calendar", group: "main", icon: "calendar", tagline: "Scheduled events, forecasts and their last reactions." },
  { label: "Channel", href: "/app/channel", group: "main", icon: "channel", tagline: "Desk notes and threads from the analysts." },
  { label: "Trading Plan", href: "/app/plan", group: "tools", icon: "plan", tagline: "Entries, stops and targets with the thesis behind them." },
  { label: "Consultation", href: "/app/consult", group: "tools", icon: "consult", tagline: "Ask the desk about a setup, one to one." },
  { label: "Education", href: "/app/education", group: "tools", icon: "education", tagline: "Primers and video modules for the method." },
  { label: "Hashtags", href: "/app/tags", group: "tools", icon: "tags", tagline: "Every item filed by theme." },
  { label: "RSI Heatmap", href: "/app/heatmap", group: "tools-forex", icon: "heatmap", tagline: "Overbought and oversold across pairs and timeframes." },
  { label: "ATR Levels", href: "/app/atr", group: "tools-forex", icon: "atr", tagline: "Daily range bands per instrument." },
  { label: "Macro", href: "/app/macro", group: "tools-forex", icon: "macro", tagline: "Central banks, rate gaps, yields and risk mood for FX." },
  { label: "Morning Scan", href: "/app/lab/scan", group: "tools-forex", icon: "scan", tagline: "Read every market after the daily close, then rank today's plan." },
  { label: "Chart Lab", href: "/app/lab", group: "tools-forex", icon: "method", soon: !isMockMode(), tagline: "Key levels, breakouts and setups drawn on the chart for every market." },
  { label: "Gap Scanner", href: "/app/gap-screener", group: "tools-forex", icon: "gap", tagline: "Weekend gaps and whether they filled." },
  { label: "Token Unlocks", href: "/app/unlocks", group: "tools-crypto", icon: "unlocks", tagline: "Supply shocks from upcoming unlocks, top 200 only." },
  { label: "Upgrade Radar", href: "/app/upgrades", group: "tools-crypto", icon: "radar", tagline: "Network upgrades and launches that move price." },
  { label: "Intel Map", href: "/app/intel", group: "tools", icon: "intel", tagline: "Where the news is coming from." },
  { label: "Watchlist", href: "/app/watchlist", group: "tools", icon: "watchlist", tagline: "The instruments you follow." },
  { label: "Journal", href: "/app/journal", group: "tools", icon: "journal", tagline: "Check a plan before you trade, log it, and see what links your winners." },
  { label: "Subscription", href: "/app/subscription", group: "account", icon: "subscription", tagline: "Your tier and billing." },
  { label: "Settings", href: "/app/settings", group: "account", icon: "settings", tagline: "Profile, notifications and preferences." },
  { label: "Admin", href: "/admin/review", group: "admin", icon: "admin", tagline: "Review queue and sources." },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  if (!pathname.startsWith(href)) return false;
  // A more specific entry wins: /app/lab/scan is Morning Scan, not Chart Lab.
  return !nav.some((n) => n.href !== href && n.href.startsWith(href) && pathname.startsWith(n.href));
}

/** Header title + tagline for the current route. */
export function routeMeta(pathname: string): { title: string; tagline: string } {
  const sym = pathname.match(/^\/app\/instrument\/([^/]+)/)?.[1];
  if (sym) return { title: decodeURIComponent(sym).toUpperCase(), tagline: "Price, levels, plan and news for one instrument." };
  const chart = pathname.match(/^\/app\/chart\/([^/]+)/)?.[1];
  if (chart) return { title: `${decodeURIComponent(chart).toUpperCase()} chart`, tagline: "Price with the news and macro events that moved it." };
  const hit = [...nav].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(pathname, n.href));
  return hit ? { title: hit.label, tagline: hit.tagline } : { title: "Home", tagline: nav[0].tagline };
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const props = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (name) {
    case "home": return <svg {...props}><path d="M2 6.5L8 2l6 4.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" /><path d="M6 14V9h4v5" /></svg>;
    case "brief": return <svg {...props}><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M6 5h4M6 8h4M6 11h2" /></svg>;
    case "news": return <svg {...props}><path d="M2 3h8v10H3a1 1 0 01-1-1V3z" /><path d="M10 6h4v6a1 1 0 01-1 1h-3V6z" /><path d="M4 6h4M4 8.5h4" /></svg>;
    case "calendar": return <svg {...props}><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M2 7h12M5 1v3M11 1v3" /></svg>;
    case "channel": return <svg {...props}><path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H9l-3 3v-3H3a1 1 0 01-1-1V4a1 1 0 011-1z" /></svg>;
    case "plan": return <svg {...props}><path d="M2 2l4 12L9 7l5 7" /><circle cx="13" cy="3" r="1.5" /></svg>;
    case "consult": return <svg {...props}><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" /></svg>;
    case "education": return <svg {...props}><path d="M8 2L1 6l7 4 7-4-7-4z" /><path d="M3 8v4c0 1 2.2 2 5 2s5-1 5-2V8" /></svg>;
    case "tags": return <svg {...props}><path d="M2 8V3a1 1 0 011-1h5l6 6-5 5-6-6z" /><circle cx="5.5" cy="5.5" r="1" /></svg>;
    case "method": return <svg {...props}><path d="M2 5h12M2 11h12" strokeDasharray="2 2" /><path d="M3 13l4-6 3 3 3-6" /></svg>;
    case "scan": return <svg {...props}><circle cx="8" cy="8" r="5.5" /><path d="M8 8l3-3" /><path d="M8 2.5v1M13.5 8h-1M8 13.5v-1M2.5 8h1" /></svg>;
    case "journal": return <svg {...props}><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M6 2v12M8.5 5.5h2.5M8.5 8h2.5" /></svg>;
    case "macro": return <svg {...props}><path d="M2 13h12" /><path d="M3 10l3-3 3 2 4-5" /><circle cx="13" cy="4" r="1" /></svg>;
    case "heatmap": return <svg {...props}><rect x="2" y="2" width="4" height="4" rx="0.5" /><rect x="6" y="6" width="4" height="4" rx="0.5" /><rect x="10" y="2" width="4" height="4" rx="0.5" /><rect x="2" y="10" width="4" height="4" rx="0.5" /><rect x="10" y="10" width="4" height="4" rx="0.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="12" cy="8" r="1.5" /></svg>;
    case "atr": return <svg {...props}><path d="M2 4h12M2 8h8M2 12h10" strokeWidth="2" strokeLinecap="round" /></svg>;
    case "gap": return <svg {...props}><path d="M2 5h12M2 11h12" /><path d="M8 5V2M8 14v-3" strokeWidth="2" /><path d="M5 8h6" strokeDasharray="2 2" /></svg>;
    case "unlocks": return <svg {...props}><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M6 7V5a2 2 0 013.4-1.4" /><path d="M8 10v1.5" /></svg>;
    case "radar": return <svg {...props}><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2.5" /><path d="M8 8l4-2.5" /></svg>;
    case "intel": return <svg {...props}><circle cx="8" cy="8" r="2" /><circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><path d="M6 6.5L5 5M10 6.5l1-1.5M6 9.5L5 11M10 9.5l1 1.5" /></svg>;
    case "watchlist": return <svg {...props}><path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.4l-3.7 1.8.7-4.1-3-2.9 4.2-.6L8 2z" /></svg>;
    case "subscription": return <svg {...props}><rect x="2" y="4" width="12" height="8" rx="1" /><path d="M2 7h12" /></svg>;
    case "admin": return <svg {...props}><path d="M8 1L2 4v4c0 4 2.5 6.5 6 8 3.5-1.5 6-4 6-8V4L8 1z" /><path d="M6 8l2 2 3-4" /></svg>;
    case "settings": return <svg {...props}><circle cx="8" cy="8" r="2.25" /><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" /></svg>;
    default: return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const {
    tier,
    navOpen,
    setNavOpen,
    operatorName,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAppState();
  const paid = isPaid(tier);
  const [isAdmin, setIsAdmin] = useState(false);
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [partnersOpen, setPartnersOpen] = useState(true);
  const drawerRef = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Demo mode has no API: show the admin entry and skip the partner fetch.
    if (isMockMode()) {
      setIsAdmin(true);
      return;
    }
    apiGet<{ isAdmin: boolean }>("/users/me")
      .then((data) => {
        if (data?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
    apiGet<ReferralPartner[]>("/referral/partners")
      .then((data) => { if (data) setPartners(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    lastFocused.current = document.activeElement as HTMLElement;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [navOpen]);

  const collapsed = sidebarCollapsed;
  const group = (g: string | string[]) =>
    nav.filter((n) => (Array.isArray(g) ? g.includes(n.group) : n.group === g));

  const inner = (rail: boolean) => (
    <div className="flex h-full flex-col">
      {/* Brand + collapse */}
      <div className={cn("flex items-center pt-5 pb-4", rail ? "flex-col gap-2" : "gap-2.5 pl-2")}>
        <Link
          href="/app"
          title="+vantage"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {rail
            ? <img src="/figma/logo-mark.png" alt="+vantage" width={32} height={32} className="h-8 w-8 shrink-0" />
            : <img src="/logo-vantage.png" alt="+vantage" width={319} height={73} className="h-7 w-auto" />}
        </Link>
        <button
          onClick={() => (navOpen ? setNavOpen(false) : setSidebarCollapsed(!collapsed))}
          aria-label={navOpen ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={navOpen ? "Close" : collapsed ? "Expand sidebar · \\" : "Collapse sidebar · \\"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-panel hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            {navOpen
              ? <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              : <path d={collapsed ? "M3.5 4l4 4-4 4M8.5 4l4 4-4 4" : "M12.5 4l-4 4 4 4M7.5 4l-4 4 4 4"} strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </button>
      </div>

      {/* Account */}
      <Link
        href="/app/settings"
        title={rail ? operatorName : undefined}
        className={cn(
          "mb-4 flex items-center gap-3 rounded-2xl bg-panel transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
          rail ? "mx-auto h-11 w-11 justify-center" : "p-2.5",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 font-num text-sm font-bold text-brand">
          {operatorName.charAt(0).toUpperCase()}
        </span>
        {!rail && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{operatorName}</span>
            <span className="block text-xs text-white/55">{paid ? "VIP+ Trader" : tier === "crypto" ? "Crypto" : "Free"}</span>
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav aria-label="Main" className="-mx-1 flex-1 overflow-y-auto px-1 pb-4">
        <NavGroup label="Main" rail={rail}>
          {group("main").map((n) => <NavItem key={n.href} {...n} active={isActive(pathname, n.href)} tier={tier} rail={rail} />)}
        </NavGroup>
        <NavGroup label="Tools" rail={rail}>
          {group("tools").map((n) => <NavItem key={n.href} {...n} active={isActive(pathname, n.href)} tier={tier} rail={rail} />)}
        </NavGroup>
        <NavGroup label="Forex" rail={rail}>
          {group("tools-forex").map((n) => <NavItem key={n.href} {...n} active={isActive(pathname, n.href)} tier={tier} rail={rail} />)}
        </NavGroup>
        <NavGroup label="Crypto" rail={rail}>
          {group("tools-crypto").map((n) => <NavItem key={n.href} {...n} active={isActive(pathname, n.href)} tier={tier} rail={rail} />)}
        </NavGroup>
        {!rail && partners.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setPartnersOpen((o) => !o)}
              aria-expanded={partnersOpen}
              className="mb-1 flex w-full items-center justify-between px-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/30 transition-colors hover:text-white/55"
            >
              Trading Platform
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("transition-transform duration-200", partnersOpen ? "rotate-0" : "-rotate-90")}>
                <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {partnersOpen && partners.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-8 items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium text-white/55 transition-colors hover:bg-panel/60 hover:text-white"
              >
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt="" width={16} height={16} className="shrink-0 rounded" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/10 text-[9px] font-bold text-white/60">{p.name.charAt(0)}</span>
                )}
                <span className="truncate">{p.name}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" className="ml-auto shrink-0 text-white/30 group-hover:text-white/60">
                  <path d="M3 1h6v6M9 1L4 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        )}
        <NavGroup label="Account" rail={rail}>
          {group(["self", "account"]).map((n) => <NavItem key={n.href} {...n} active={isActive(pathname, n.href)} tier={tier} rail={rail} />)}
          {isAdmin && group("admin").map((n) => <NavItem key={n.href} {...n} active={pathname.startsWith("/admin")} tier={tier} rail={rail} />)}
          <LogoutButton
            className={cn(
              "flex h-8 w-full items-center gap-3 rounded-xl text-[14px] font-medium text-white/55 transition-colors hover:bg-panel/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              rail ? "justify-center" : "px-3.5",
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-white/40" aria-hidden>
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11.5L14 8l-3.5-3.5M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {rail ? <span className="sr-only">Log out</span> : "Log out"}
          </LogoutButton>
        </NavGroup>
      </nav>

      {/* Upgrade card, free tier only */}
      {!paid && (
        rail ? (
          <Link
            href="/app/subscription"
            title="Upgrade to VIP+"
            aria-label="Upgrade to VIP+"
            className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-black transition-colors hover:bg-brand-dim"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 12L12 4M6 4h6v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        ) : (
          <div className="mb-4 rounded-2xl bg-brand p-4 text-black">
            <div className="font-num text-[22px] font-semibold leading-6">Unlock VIP+</div>
            <p className="mt-1 text-[13px] leading-[18px] text-black/70">Trading plans, 1v1 consults and the crypto radars.</p>
            <Link
              href="/app/subscription"
              className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full bg-black text-[13px] font-semibold text-white transition-colors hover:bg-black-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
            >
              Upgrade
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M3 9l6-6M4.5 3H9v4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        )
      )}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 bg-black transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px] px-3" : "w-[248px] px-4",
        )}
      >
        <div className="sticky top-0 h-screen">{inner(collapsed)}</div>
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", navOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          onClick={() => setNavOpen(false)}
          className={cn("absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300", navOpen ? "opacity-100" : "opacity-0")}
        />
        <aside
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-black px-4 transition-transform duration-300",
            navOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {inner(false)}
        </aside>
      </div>
    </>
  );
}

function NavGroup({ label, rail, children }: { label: string; rail: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      {rail
        ? <div className="mx-auto mb-2 mt-3 h-px w-6 bg-white/10" aria-hidden />
        : <div className="mb-1 px-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">{label}</div>}
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  );
}

function NavItem({
  label, href, icon, active, soon, tier, rail,
}: {
  label: string; href: string; icon: string;
  active?: boolean; soon?: boolean; tier: Tier; rail: boolean;
}) {
  // Same rule as the page guards: shared canOpenRoute. Admin console isn't an /app route.
  const isLocked = href.startsWith("/app") && !canOpenRoute(tier, href);
  return (
    <Link
      href={href}
      title={rail ? label : undefined}
      aria-label={rail ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 shrink-0 items-center gap-3 rounded-xl text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        rail ? "justify-center" : "px-3.5",
        active
          ? "bg-panel font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          : "font-medium text-white/55 hover:bg-panel/60 hover:text-white",
      )}
    >
      <NavIcon name={icon} className={cn("shrink-0", active ? "text-brand" : "text-white/40 group-hover:text-white/70")} />
      {!rail && <span className="flex-1 truncate">{label}</span>}
      {!rail && soon && (
        <span className="rounded-full border border-brand/30 px-1.5 text-[10px] font-semibold leading-4 tracking-[0.04em] text-brand/80">SOON</span>
      )}
      {!rail && !soon && isLocked && (
        <span className="rounded-full border border-white/10 px-1.5 text-[10px] font-semibold leading-4 tracking-[0.04em] text-white/40">PRO</span>
      )}
    </Link>
  );
}
