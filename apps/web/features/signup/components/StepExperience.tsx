"use client";

import {
  PROFITABLE_PERIODS,
  TRADING_LENGTHS,
  type ProfileForm,
} from "@/features/signup/types";
import { Choice, questionEyebrow, questionTitle } from "./Choice";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
};

export function StepExperience({ form, setForm }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className={questionEyebrow}>Question 1 · Time trading</p>
        <h2 className={questionTitle}>How long have you been trading?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {TRADING_LENGTHS.map((opt) => (
            <Choice
              key={opt.value}
              selected={form.tradingLength === opt.value}
              onClick={() => setForm({ ...form, tradingLength: opt.value })}
            >
              {opt.label}
            </Choice>
          ))}
        </div>
      </div>

      <div>
        <p className={questionEyebrow}>Question 2 · Longest profitable period</p>
        <h2 className={questionTitle}>What&apos;s the longest you&apos;ve stayed profitable?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PROFITABLE_PERIODS.map((opt) => (
            <Choice
              key={opt.value}
              selected={form.longestProfitable === opt.value}
              onClick={() => setForm({ ...form, longestProfitable: opt.value })}
            >
              {opt.label}
            </Choice>
          ))}
        </div>
      </div>
    </div>
  );
}
