import Link from "next/link";
import { cn } from "@/lib/cn";

/** Bento panel used across the revamped app: raised surface, title row, optional action. */
export function Panel({
  title,
  sub,
  action,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cn("flex min-w-0 flex-col rounded-2xl bg-panel p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold leading-[22px] text-white">{title}</h2>}
            {sub && <p className="text-[13px] leading-[18px] text-white/55">{sub}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
    </Tag>
  );
}

/** Small text link used in panel headers. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      {children}
    </Link>
  );
}
