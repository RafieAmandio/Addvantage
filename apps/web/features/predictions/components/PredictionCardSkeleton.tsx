"use client";

import { cn } from "@/lib/cn";

export function PredictionCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gray border border-white/[0.06] p-4 animate-pulse",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-6 bg-white/[0.06]" />
        <div className="h-3 w-16 bg-white/[0.06]" />
      </div>

      <div className="mb-4 h-4 w-3/4 bg-white/[0.06]" />

      <div className="space-y-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="mb-1 flex justify-between">
                <div className="h-3 w-24 bg-white/[0.04]" />
                <div className="h-3 w-10 bg-white/[0.04]" />
              </div>
              <div className="h-1 w-full bg-white/[0.06]">
                <div
                  className="h-full bg-white/[0.08]"
                  style={{ width: `${40 + i * 20}%` }}
                />
              </div>
            </div>
            <div className="h-6 w-14 border border-white/[0.06]" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between border-t border-white/[0.04] pt-3">
        <div className="h-2.5 w-16 bg-white/[0.04]" />
        <div className="h-2.5 w-16 bg-white/[0.04]" />
      </div>
    </div>
  );
}
