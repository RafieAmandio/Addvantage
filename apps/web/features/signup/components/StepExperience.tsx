"use client";

import { DataLabel } from "@/components/ui/Marker";
import {
  PROFITABLE_PERIODS,
  TRADING_LENGTHS,
  type ProfileForm,
} from "@/features/signup/types";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
};

export function StepExperience({ form, setForm }: Props) {
  return (
    <div className="space-y-8 stagger">
      <div className="space-y-4">
        <DataLabel>Question 01 / Length of time trading</DataLabel>
        <h2 className="font-display text-3xl text-paper">
          How long have you been trading?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TRADING_LENGTHS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() =>
                setForm({ ...form, tradingLength: opt.value })
              }
              className={
                "relative border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all " +
                (form.tradingLength === opt.value
                  ? "border-lime bg-lime/10 text-lime"
                  : "border-ink-3 text-paper/60 hover:border-lime/40 hover:text-paper")
              }
            >
              <span className="absolute right-3 top-3 text-[9px] text-paper/20">
                {i + 1}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-ink-3 pt-8 space-y-4">
        <DataLabel>Question 02 / Longest profitable period</DataLabel>
        <h2 className="font-display text-3xl text-paper">
          What's the longest you've stayed profitable?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PROFITABLE_PERIODS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() =>
                setForm({ ...form, longestProfitable: opt.value })
              }
              className={
                "relative border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all " +
                (form.longestProfitable === opt.value
                  ? "border-lime bg-lime/10 text-lime"
                  : "border-ink-3 text-paper/60 hover:border-lime/40 hover:text-paper")
              }
            >
              <span className="absolute right-3 top-3 text-[9px] text-paper/20">
                {i + 1}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
