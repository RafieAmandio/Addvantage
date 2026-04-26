"use client";

import { DataLabel } from "@/components/ui/Marker";
import { MARKETS, type ProfileForm } from "@/features/signup/types";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  toggleMarket: (m: string) => void;
};

export function StepMarketsGoal({ form, setForm, toggleMarket }: Props) {
  return (
    <div className="space-y-8 stagger">
      <div className="space-y-4">
        <DataLabel>Question 03 / Markets traded</DataLabel>
        <h2 className="font-display text-3xl text-white">
          Which markets do you trade?
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          SELECT ALL THAT APPLY
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MARKETS.map((opt, i) => {
            const selected = form.markets.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleMarket(opt.value)}
                className={
                  "relative border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
                  (selected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-3 text-white/60 hover:border-brand/40 hover:text-white")
                }
              >
                <span className="absolute right-3 top-3 text-[9px] text-white/20">
                  {i + 1}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      "flex h-4 w-4 items-center justify-center border text-[10px] " +
                      (selected
                        ? "border-brand bg-brand text-black"
                        : "border-white/30")
                    }
                  >
                    {selected && "✓"}
                  </span>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-3 pt-8 space-y-4">
        <DataLabel>Question 04 / Annual target</DataLabel>
        <h2 className="font-display text-3xl text-white">
          What's your trading goal this year?
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          Be specific. A number, a milestone, a behaviour change.
        </p>
        <input
          type="text"
          value={form.yearlyGoal}
          onChange={(e) => setForm({ ...form, yearlyGoal: e.target.value })}
          placeholder="e.g. 30% annual return, consistent 2R average, survive the year without blowing up"
          className="mt-2 w-full border-b border-white/20 bg-transparent py-3 font-mono text-lg text-white placeholder:text-white/20 outline-none transition-colors focus-visible:border-brand"
        />
      </div>
    </div>
  );
}
