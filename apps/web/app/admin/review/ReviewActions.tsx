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

  const base =
    "inline-flex h-8 items-center rounded-full px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-wait";

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => act("approve", e)}
        disabled={pending !== null}
        title="Approve"
        aria-label="Approve"
        className={cn(base, "bg-up text-black hover:opacity-90", pending === "approve" && "opacity-60", pending === "reject" && "opacity-40")}
      >
        {pending === "approve" ? "Approving" : "Approve"}
      </button>
      <button
        onClick={(e) => act("reject", e)}
        disabled={pending !== null}
        title="Reject"
        aria-label="Reject"
        className={cn(base, "border border-down/40 text-down hover:bg-down/10", pending === "reject" && "opacity-60", pending === "approve" && "opacity-40")}
      >
        {pending === "reject" ? "Rejecting" : "Reject"}
      </button>
    </div>
  );
}
