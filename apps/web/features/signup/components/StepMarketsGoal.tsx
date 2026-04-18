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
        <h2 className="font-display text-3xl text-paper">
          Which markets do you trade?
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
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
                  "relative border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all " +
                  (selected
                    ? "border-lime bg-lime/10 text-lime"
                    : "border-ink-3 text-paper/60 hover:border-lime/40 hover:text-paper")
                }
              >
                <span className="absolute right-3 top-3 text-[9px] text-paper/20">
                  {i + 1}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      "flex h-4 w-4 items-center justify-center border text-[10px] " +
                      (selected
                        ? "border-lime bg-lime text-ink"
                        : "border-paper/30")
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

      <div className="border-t border-ink-3 pt-8 space-y-4">
        <DataLabel>Question 04 / Annual target</DataLabel>
        <h2 className="font-display text-3xl text-paper">
          What's your trading goal this year?
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          Be specific. A number, a milestone, a behaviour change.
        </p>
        <input
          type="text"
          value={form.yearlyGoal}
          onChange={(e) => setForm({ ...form, yearlyGoal: e.target.value })}
          placeholder="e.g. 30% annual return, consistent 2R average, survive the year without blowing up"
          className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg text-paper placeholder:text-paper/20 outline-none focus:border-lime"
        />
      </div>
    </div>
  );
}
