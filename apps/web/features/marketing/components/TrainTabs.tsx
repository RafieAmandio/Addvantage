"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type TrainTab = { label: string; title: string; body: string; demo: React.ReactNode };

/**
 * The three training tools in one stage: a segmented control picks the tool, its copy sits beside
 * the switch and its demo plays in the stage. Only the picked demo is mounted, so the other two
 * do not run their loops unseen. Arrow keys move between tabs.
 */
export function TrainTabs({ tabs }: { tabs: TrainTab[] }) {
  const [on, setOn] = useState(0);
  const t = tabs[on]!;
  const pick = (i: number) => {
    setOn(i);
    document.getElementById(`train-tab-${i}`)?.focus();
  };
  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
      <div className="flex flex-col">
        <div
          role="tablist"
          aria-label="Training tools"
          className="grid grid-cols-3 border border-tv-ink"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") pick((on + 1) % tabs.length);
            else if (e.key === "ArrowLeft") pick((on + tabs.length - 1) % tabs.length);
          }}
        >
          {tabs.map((x, i) => (
            <button
              key={x.label}
              id={`train-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={on === i}
              aria-controls="train-stage"
              tabIndex={on === i ? 0 : -1}
              onClick={() => setOn(i)}
              className={cn("tv-seg font-mono text-[11px] uppercase tracking-[0.08em] sm:text-[12px]", on === i && "tv-seg-on", i > 0 && "border-l border-tv-ink")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div key={on} className="lv-in mt-6 max-w-[52ch]">
          <h3 className="text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">{t.title}</h3>
          <p className="mt-2 text-[16px] leading-relaxed text-tv-graphite">{t.body}</p>
        </div>
      </div>
      <div id="train-stage" role="tabpanel" aria-labelledby={`train-tab-${on}`} className="md:min-h-[440px]">
        <div key={on} className="lv-in">
          {t.demo}
        </div>
      </div>
    </div>
  );
}
