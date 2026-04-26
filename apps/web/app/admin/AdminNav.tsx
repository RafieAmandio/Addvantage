"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/review", label: "Review" },
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/logs", label: "Logs" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest2">
      {LINKS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              "focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
              (active
                ? "text-brand"
                : "text-white/60 transition-colors hover:text-brand")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
