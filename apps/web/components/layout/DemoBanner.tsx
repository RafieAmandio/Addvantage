import { isMockMode } from "@/lib/config/public";

export function DemoBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="border-b border-brand/20 bg-brand/[0.06] px-4 py-1.5 text-center text-xs text-brand">
      Demo mode: sample desk content, live market prices.
    </div>
  );
}
