import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  onExportDigest: () => void;
  className?: string;
};

const BTN =
  "rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

/** Archive actions. The TopBar carries the page title, so this is buttons only. */
export function PlanArchiveHeader({ onExportDigest, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link href="/app/plan" className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand">
        Current plan
      </Link>
      <Link href="/app/plan/compare" title="Put two plans side by side" className={BTN}>
        Compare
      </Link>
      <button onClick={onExportDigest} title="Copy archive as markdown digest" className={BTN}>
        Export digest
      </button>
    </div>
  );
}
