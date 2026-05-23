"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPut } from "@/lib/api/client";
import { cn } from "@/lib/cn";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  if (status !== "pending") return null;

  const act = async (action: "approve" | "reject", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPending(action);
    try {
      await apiPut(`/news/${id}/${action}`);
      router.refresh();
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => act("approve", e)}
        disabled={pending !== null}
        title="Approve"
        aria-label="Approve"
        className={cn(
          "flex h-8 w-8 items-center justify-center border font-mono text-sm transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
          pending === "approve"
            ? "border-moss/60 bg-moss/20 text-moss animate-pulse"
            : "border-moss/40 text-moss/60 hover:bg-moss/10 hover:text-moss"
        )}
      >
        ✓
      </button>
      <button
        onClick={(e) => act("reject", e)}
        disabled={pending !== null}
        title="Reject"
        aria-label="Reject"
        className={cn(
          "flex h-8 w-8 items-center justify-center border font-mono text-sm transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
          pending === "reject"
            ? "border-blood/60 bg-blood/20 text-blood-bright animate-pulse"
            : "border-blood/40 text-blood-bright/60 hover:bg-blood/10 hover:text-blood-bright"
        )}
      >
        ✕
      </button>
    </div>
  );
}
