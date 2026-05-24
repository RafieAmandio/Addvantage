"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppState, isPaid } from "@/lib/state";
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

const nav = [
  { label: "Home", href: "/app", group: "main", icon: "home" },
  { label: "Today's Brief", href: "/app/brief", group: "main", icon: "brief" },
  { label: "News", href: "/app/news", group: "main", icon: "news" },
  { label: "Calendar", href: "/app/calendar", group: "main", icon: "calendar" },
  { label: "Channel", href: "/app/channel", group: "main", icon: "channel" },
  { label: "Trading Plan", href: "/app/plan", group: "tools", locked: true, icon: "plan" },
  { label: "Consultation", href: "/app/consult", group: "tools", locked: true, icon: "consult" },
  { label: "Education", href: "/app/education", group: "tools", icon: "education" },
  { label: "Hashtags", href: "/app/tags", group: "tools", icon: "tags" },
  { label: "RSI Heatmap", href: "/app/heatmap", group: "tools", icon: "heatmap" },
  { label: "Intel Map", href: "/app/intel", group: "tools", icon: "intel" },
  { label: "Watchlist", href: "/app/watchlist", group: "tools", icon: "watchlist" },
  { label: "Subscription", href: "/app/subscription", group: "account", icon: "subscription" },
  { label: "Admin", href: "/admin/review", group: "admin", icon: "admin" },
];

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
    case "heatmap": return <svg {...props}><rect x="2" y="2" width="4" height="4" rx="0.5" /><rect x="6" y="6" width="4" height="4" rx="0.5" /><rect x="10" y="2" width="4" height="4" rx="0.5" /><rect x="2" y="10" width="4" height="4" rx="0.5" /><rect x="10" y="10" width="4" height="4" rx="0.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="12" cy="8" r="1.5" /></svg>;
    case "intel": return <svg {...props}><circle cx="8" cy="8" r="2" /><circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><path d="M6 6.5L5 5M10 6.5l1-1.5M6 9.5L5 11M10 9.5l1 1.5" /></svg>;
    case "watchlist": return <svg {...props}><path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.4l-3.7 1.8.7-4.1-3-2.9 4.2-.6L8 2z" /></svg>;
    case "subscription": return <svg {...props}><rect x="2" y="4" width="12" height="8" rx="1" /><path d="M2 7h12" /></svg>;
    case "admin": return <svg {...props}><path d="M8 1L2 4v4c0 4 2.5 6.5 6 8 3.5-1.5 6-4 6-8V4L8 1z" /><path d="M6 8l2 2 3-4" /></svg>;
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

  const inner = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="font-mono text-base font-bold text-white transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          +vantage
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar · \"
            className="hidden items-center justify-center rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white lg:flex focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="flex items-center justify-center rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white lg:hidden focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <NavGroup label="Main">
          {nav.filter((n) => n.group === "main").map((n) => (
            <NavItem key={n.href} {...n} active={pathname === n.href} paid={paid} />
          ))}
        </NavGroup>
        <NavGroup label="Tools">
          {nav.filter((n) => n.group === "tools").map((n) => (
            <NavItem key={n.href} {...n} active={pathname.startsWith(n.href)} paid={paid} />
          ))}
        </NavGroup>
        <NavGroup label="Account">
          {nav.filter((n) => n.group === "self" || n.group === "account").map((n) => (
            <NavItem key={n.href} {...n} active={pathname === n.href} paid={paid} />
          ))}
        </NavGroup>
        {partners.length > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setPartnersOpen((o) => !o)}
              className="mb-1.5 flex w-full items-center justify-between px-3 text-[11px] font-medium uppercase tracking-wider text-white/25 hover:text-white/40 transition-colors"
            >
              Trading Platform
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={cn("transition-transform duration-200", partnersOpen ? "rotate-0" : "-rotate-90")}
              >
                <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {partnersOpen && (
              <div className="space-y-0.5">
                {["crypto_exchange", "broker"].map((cat) => {
                  const items = partners.filter((p) => p.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/20">
                        {cat === "crypto_exchange" ? "Crypto Exchange" : "Broker"}
                      </div>
                      {items.map((p) => (
                        <a
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-all duration-150 hover:bg-white/[0.04] hover:text-white"
                        >
                          {p.iconUrl ? (
                            <img src={p.iconUrl} alt="" width={20} height={20} className="shrink-0 rounded" />
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-white/60">
                              {p.name.charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="truncate">{p.name}</span>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" className="shrink-0 text-white/30 group-hover:text-white/60">
                                <path d="M3 1h6v6M9 1L4 6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            {p.tagline && (
                              <div className="truncate text-[11px] text-white/30 group-hover:text-white/40">{p.tagline}</div>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <NavGroup label="Admin">
            {nav.filter((n) => n.group === "admin").map((n) => (
              <NavItem key={n.href} {...n} active={pathname.startsWith("/admin")} paid={paid} />
            ))}
          </NavGroup>
        )}
      </nav>

      {/* User card */}
      <div className="border-t border-white/[0.06] px-3 py-4">
        <div className="rounded-xl bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 font-mono text-xs font-bold text-brand">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {operatorName}
              </div>
              <div className="text-xs text-white/40">
                {paid ? "VIP+ Trader" : "Free"}
              </div>
            </div>
          </div>
          {!paid && (
            <Link
              href="/app/subscription"
              className="mt-3 block rounded-lg bg-brand px-3 py-2 text-center text-xs font-bold text-black transition-colors hover:bg-brand-dim focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Upgrade
            </Link>
          )}
          <div className="mt-3 flex items-center justify-between">
            <LogoutButton className="text-xs text-white/40 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!sidebarCollapsed && (
        <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.06] bg-black-2 lg:block">
          <div className="sticky top-0 h-screen">{inner}</div>
        </aside>
      )}

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          navOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          onClick={() => setNavOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
            navOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/[0.06] bg-black-2 transition-transform duration-300",
            navOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {inner}
        </aside>
      </div>
    </>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  label, href, icon, active, locked, paid,
}: {
  label: string; href: string; icon: string;
  active?: boolean; locked?: boolean; paid: boolean;
}) {
  const isLocked = locked && !paid;
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
        active
          ? "bg-brand/10 font-medium text-brand"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <NavIcon name={icon} className={cn("shrink-0", active ? "text-brand" : "text-white/30 group-hover:text-white/50")} />
      <span className="flex-1">{label}</span>
      {isLocked && (
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/30">
          PRO
        </span>
      )}
    </Link>
  );
}
