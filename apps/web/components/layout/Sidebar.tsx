"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

const nav = [
  { code: "TX-00", label: "Home", href: "/app", group: "live" },
  { code: "TX-00b", label: "Today's Brief", href: "/app/brief", group: "live" },
  { code: "TX-01", label: "News", href: "/app/news", group: "live" },
  { code: "TX-02", label: "Calendar", href: "/app/calendar", group: "live" },
  { code: "TX-06", label: "My Channel", href: "/app/channel", group: "live" },
  { code: "TX-03", label: "Trading Plan", href: "/app/plan", group: "ops", locked: true },
  { code: "TX-04", label: "Consultation", href: "/app/consult", group: "ops", locked: true },
  { code: "TX-05", label: "Education", href: "/app/education", group: "ops" },
  { code: "—", label: "Hashtags", href: "/app/tags", group: "ops" },
  { code: "—", label: "Watchlist", href: "/app/watchlist", group: "ops" },
  { code: "—", label: "Subscription", href: "/app/subscription", group: "self" },
];

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
  const drawerRef = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

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
      <div className="flex items-center justify-between border-b border-gray-3 px-6 py-6">
        <div>
          <Link
            href="/"
            className="group font-display text-3xl text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            ANTS<span className="text-brand">.</span>
          </Link>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            DOMAIN // OPERATOR
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar · \"
            className="hidden items-center justify-center border border-gray-3 p-2 text-white/60 transition-colors hover:border-brand hover:text-brand lg:flex"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="flex items-center justify-center border border-gray-3 p-2 text-white/60 transition-colors hover:border-brand hover:text-brand lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <NavGroup label="Live transmissions">
          {nav.filter((n) => n.group === "live").map((n) => (
            <NavItem key={n.href} {...n} active={pathname === n.href} paid={paid} />
          ))}
        </NavGroup>
        <NavGroup label="Operator surfaces">
          {nav.filter((n) => n.group === "ops").map((n) => (
            <NavItem key={n.href} {...n} active={pathname.startsWith(n.href)} paid={paid} />
          ))}
        </NavGroup>
        <NavGroup label="Account">
          {nav.filter((n) => n.group === "self").map((n) => (
            <NavItem key={n.href} {...n} active={pathname === n.href} paid={paid} />
          ))}
        </NavGroup>
      </nav>

      <div className="border-t border-gray-3 p-4">
        <div className="border border-brand/30 bg-brand/5 p-3">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
              ● TIER {paid ? "01" : "00"}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              U-00417
            </div>
          </div>
          <div className="mt-2 font-display text-lg leading-tight text-white">
            {operatorName}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50">
            {paid ? "VIP+ Trader" : "Free access"}
          </div>
          {!paid && (
            <Link
              href="/app/subscription"
              className="mt-3 block font-mono text-[10px] uppercase tracking-widest2 text-white/60 underline decoration-brand/40 transition-colors hover:text-brand hover:decoration-brand"
            >
              Upgrade access →
            </Link>
          )}
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!sidebarCollapsed && (
        <aside className="hidden w-64 shrink-0 border-r border-gray-3 bg-gray-2/40 lg:block">
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
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-brand/40 bg-gray-2 transition-transform duration-300",
            navOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ boxShadow: navOpen ? "0 0 60px rgba(255,212,0,0.1)" : undefined }}
        >
          {inner}
        </aside>
      </div>
    </>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 px-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
        {label}
      </div>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

function NavItem({
  code, label, href, active, locked, paid,
}: {
  code: string; label: string; href: string;
  active?: boolean; locked?: boolean; paid: boolean;
}) {
  const isLocked = locked && !paid;
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between px-3 py-2 transition-all duration-150",
        active
          ? "border-l-2 border-brand bg-brand/10 text-brand"
          : "border-l-2 border-transparent text-white/60 hover:border-brand/40 hover:bg-gray-2 hover:text-white"
      )}
    >
      <span className="flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest2 opacity-60">
          {code}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest2">
          {label}
        </span>
      </span>
      {isLocked && (
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-red-500">
          ●
        </span>
      )}
    </Link>
  );
}
