"use client";

import { cn } from "@/lib/cn";
import { MARKETS, type ProfileForm } from "@/features/signup/types";
import { Choice, questionEyebrow, questionTitle } from "./Choice";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  toggleMarket: (m: string) => void;
};

export function StepMarketsGoal({ form, setForm, toggleMarket }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className={questionEyebrow}>Question 3 · Markets traded</p>
        <h2 className={questionTitle}>Which markets do you trade?</h2>
        <p className="mt-1 text-[13px] text-white/55">Select all that apply.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {MARKETS.map((opt) => {
            const selected = form.markets.includes(opt.value);
            return (
              <Choice key={opt.value} selected={selected} onClick={() => toggleMarket(opt.value)}>
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                      selected ? "bg-brand text-black" : "ring-1 ring-white/30"
                    )}
                  >
                    {selected && "✓"}
                  </span>
                  {opt.label}
                </span>
              </Choice>
            );
          })}
        </div>
      </div>

      <div>
        <p className={questionEyebrow}>Question 4 · Annual target</p>
        <label htmlFor="yearly-goal" className={questionTitle + " block"}>
          What&apos;s your trading goal this year?
        </label>
        <p className="mt-1 text-[13px] text-white/55">Be specific. A number, a milestone, a behaviour change.</p>
        <input
          id="yearly-goal"
          type="text"
          value={form.yearlyGoal}
          onChange={(e) => setForm({ ...form, yearlyGoal: e.target.value })}
          placeholder="e.g. 30% annual return, consistent 2R average, survive the year without blowing up"
          className="mt-4 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand"
        />
      </div>
    </div>
  );
}
