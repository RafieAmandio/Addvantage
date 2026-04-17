import { Suspense } from "react";
import { ConsultPageView } from "@/features/consult/components/ConsultPageView";

export default function ConsultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            OPENING CHANNEL
          </div>
        </div>
      }
    >
      <ConsultPageView />
    </Suspense>
  );
}
