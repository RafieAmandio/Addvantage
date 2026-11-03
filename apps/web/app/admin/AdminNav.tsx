"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin/review", label: "Review", code: "01" },
  { href: "/admin/archive", label: "Archive", code: "02" },
  { href: "/admin/plans", label: "Plans", code: "03" },
  { href: "/admin/sources", label: "Sources", code: "04" },
  { href: "/admin/channel", label: "Channel", code: "05" },
  { href: "/admin/users", label: "Users", code: "06" },
  { href: "/admin/logs", label: "Logs", code: "07" },
  { href: "/admin/consult", label: "Consult", code: "08" },
  { href: "/admin/referral", label: "Referral", code: "09" },
  { href: "/admin/videos", label: "Videos", code: "10" },
  { href: "/admin/early-access", label: "Early Access", code: "11" },
  { href: "/admin/meet", label: "Meet", code: "12" },
  { href: "/admin/bulletin", label: "Bulletin", code: "13" },
  { href: "/admin/giveaway", label: "Giveaway", code: "14" },
  { href: "/admin/black-friday", label: "Black Friday", code: "15" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex items-center gap-5 overflow-x-auto text-[14px] font-medium [scrollbar-width:none]">
      {LINKS.map(({ href, label }) => {
        const active =
          href === "/admin/review"
            ? pathname.startsWith("/admin/review")
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap py-1 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
              active ? "text-white" : "text-white/30 hover:text-white/60",
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
