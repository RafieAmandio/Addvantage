"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";

const ROUTES: Array<{ keys: string; label: string; href: string }> = [
  { keys: "g h", label: "Home", href: "/app" },
  { keys: "g b", label: "Brief", href: "/app/brief" },
  { keys: "g n", label: "News", href: "/app/news" },
  { keys: "g c", label: "Calendar", href: "/app/calendar" },
  { keys: "g m", label: "My Channel", href: "/app/channel" },
  { keys: "g p", label: "Trading Plan", href: "/app/plan" },
  { keys: "g x", label: "Plan Compare", href: "/app/plan/compare" },
  { keys: "g k", label: "Consultation", href: "/app/consult" },
  { keys: "g e", label: "Education", href: "/app/education" },
  { keys: "g v", label: "Video Modules", href: "/app/education/videos" },
  { keys: "g t", label: "Hashtags", href: "/app/tags" },
  { keys: "g w", label: "Watchlist", href: "/app/watchlist" },
  { keys: "g s", label: "Subscription", href: "/app/subscription" },
];

const TWO_KEY: Record<string, string> = Object.fromEntries(
  ROUTES.map((r) => [r.keys.replace(" ", ""), r.href])
);

export function Shortcuts() {
  const router = useRouter();
  const {
    setTier,
    tier,
    setNavOpen,
    searchOpen,
    setSearchOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAppState();
  const [pendingG, setPendingG] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K → search (works even from inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      // / → search (single key, only outside inputs)
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // ? → help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }
      // Esc → close help / nav drawer / search
      if (e.key === "Escape") {
        setShowHelp(false);
        setPendingG(false);
        setNavOpen(false);
        setSearchOpen(false);
        return;
      }
      // m → toggle mobile nav drawer
      if (e.key === "m" && !pendingG) {
        e.preventDefault();
        setNavOpen(true);
        return;
      }
      // \ → toggle desktop sidebar collapse (no-op on mobile where the
      // sidebar is a drawer, not a persistent panel)
      if (e.key === "\\" && !pendingG) {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (!isDesktop) return;
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
        setHint(sidebarCollapsed ? "SIDEBAR · EXPANDED" : "SIDEBAR · COLLAPSED");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setHint(null), 900);
        return;
      }
      // n → open notification bell
      if (e.key === "n" && !pendingG) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("ants:bell-toggle"));
        return;
      }
      // u → flip tier (operator power-user)
      if (e.key === "u" && !pendingG) {
        e.preventDefault();
        const next = tier === "vip" ? "free" : "vip";
        setTier(next);
        setHint(`TIER → ${next === "vip" ? "VIP+ TRADER" : "FREE"}`);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setHint(null), 1400);
        return;
      }

      // Two-key g-prefix
      if (pendingG) {
        const combo = "g" + e.key;
        const dest = TWO_KEY[combo];
        if (dest) {
          e.preventDefault();
          router.push(dest);
          setHint(`→ ${combo.toUpperCase()}`);
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setHint(null), 900);
        }
        setPendingG(false);
        return;
      }

      if (e.key === "g") {
        e.preventDefault();
        setPendingG(true);
        setHint("g _");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setPendingG(false);
          setHint(null);
        }, 1500);
        return;
      }

      // [ / ] → step calendar date when on /app/calendar
      if ((e.key === "[" || e.key === "]") && window.location.pathname.startsWith("/app/calendar")) {
        e.preventDefault();
        const dir = e.key === "]" ? 1 : -1;
        window.dispatchEvent(
          new CustomEvent("ants:calendar-step", { detail: dir })
        );
        setHint(e.key === "]" ? "→ NEXT" : "← PREV");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setHint(null), 800);
        return;
      }

      // j / k → step calendar by a single day (even in week/month view)
      if ((e.key === "j" || e.key === "k") && window.location.pathname.startsWith("/app/calendar")) {
        e.preventDefault();
        const dir = e.key === "j" ? 1 : -1;
        window.dispatchEvent(
          new CustomEvent("ants:calendar-day-step", { detail: dir })
        );
        setHint(e.key === "j" ? "→ +1 DAY" : "← −1 DAY");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setHint(null), 800);
        return;
      }

      // t → Today snap on calendar
      if (e.key === "t" && window.location.pathname.startsWith("/app/calendar")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("ants:calendar-today"));
        setHint("→ TODAY");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setHint(null), 800);
        return;
      }
    };

    const onShowHelp = () => setShowHelp((s) => !s);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ants:help-toggle", onShowHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ants:help-toggle", onShowHelp);
      if (timer) clearTimeout(timer);
    };
  }, [
    pendingG,
    router,
    setTier,
    tier,
    setNavOpen,
    searchOpen,
    setSearchOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
  ]);

  return (
    <>
      {hint && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 border border-brand bg-black-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest2 text-brand shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          {hint}
        </div>
      )}

      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl border border-brand bg-black-2 p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)]"
          >
            <div className="classification-stripe absolute -top-1 left-0 right-0 h-1" />
            <div className="flex items-center justify-between border-b border-brand/40 pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  REFERENCE / OPERATOR INPUT
                </div>
                <div className="font-display text-3xl text-white">
                  Keyboard <span className="italic text-brand">commands</span>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="border border-gray-3 p-2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 max-h-[60vh] space-y-6 overflow-y-auto pr-1">
              <Section label="Navigation · two-key sequences">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  {ROUTES.map((r) => (
                    <Row
                      key={r.keys}
                      keys={r.keys}
                      label={`Go to ${r.label}`}
                    />
                  ))}
                </div>
              </Section>

              <Section label="Search & notifications">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="cmd k" label="Open search palette" />
                  <Row keys="/" label="Open search palette (single key)" />
                  <Row keys="n" label="Toggle notification inbox" />
                  <Row keys="?" label="Toggle this help" />
                </div>
              </Section>

              <Section label="Global">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="u" label="Flip tier (Free / VIP+)" />
                  <Row keys="m" label="Open navigation drawer (mobile)" />
                  <Row keys="\" label="Toggle sidebar (desktop)" />
                  <Row keys="esc" label="Close overlay / drawer" />
                </div>
              </Section>

              <Section label="Calendar">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="[" label="Step back (prev day/week/month)" />
                  <Row keys="]" label="Step forward" />
                  <Row keys="k" label="Anchor −1 day (any view)" />
                  <Row keys="j" label="Anchor +1 day (any view)" />
                  <Row keys="t" label="Snap anchor to today" />
                </div>
              </Section>

              <Section label="News & Plan detail">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="j" label="Next article / older plan" />
                  <Row keys="k" label="Previous article / newer plan" />
                </div>
              </Section>

              <Section label="Page search (News · Archive · Education)">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="s" label="Focus page search input" />
                  <Row keys="esc" label="Blur search input" />
                </div>
              </Section>

              <Section label="Consultation">
                <div className="grid grid-cols-1 gap-px bg-black-3 sm:grid-cols-2">
                  <Row keys="i" label="Focus message input (insert mode)" />
                  <Row keys="esc" label="Blur input (normal mode)" />
                </div>
              </Section>
            </div>

            <div className="mt-6 border-t border-gray-3 pt-4 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              ● Two-key sequences time out after 1.5 seconds. Inputs are
              suppressed inside text fields — press ESC first to regain
              shortcut control.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
          ● {label}
        </span>
        <span className="h-px flex-1 bg-brand/20" />
      </div>
      {children}
    </section>
  );
}

function Row({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between bg-black p-3">
      <span className="font-mono text-[11px] uppercase tracking-widest2 text-white/70">
        {label}
      </span>
      <span className="flex gap-1">
        {keys.split(" ").map((k, i) => (
          <kbd
            key={i}
            className="border border-brand/40 bg-black-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-brand"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
