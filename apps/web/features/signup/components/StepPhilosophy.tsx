"use client";

import { DataLabel } from "@/components/ui/Marker";
import { FAULT_OPTIONS, type ProfileForm } from "@/features/signup/types";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
};

export function StepPhilosophy({ form, setForm }: Props) {
  return (
    <div className="space-y-6 stagger">
      <DataLabel>Question 05 / Philosophy check</DataLabel>
      <h2 className="font-display text-3xl text-paper">
        The accountability question.
      </h2>
      <div className="border border-lime/40 bg-lime/5 p-6">
        <p className="font-mono text-[11px] uppercase tracking-widest2 text-paper/80">
          If analyst Vantage gives trade ideas and you take the same trade and
          lose — whose fault is it?
        </p>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
        There is no wrong answer. Your response helps us calibrate how we
        communicate with you.
      </p>
      <div className="space-y-3">
        {FAULT_OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => setForm({ ...form, faultAttribution: opt.value })}
            className={
              "relative w-full border p-5 text-left transition-all " +
              (form.faultAttribution === opt.value
                ? "border-lime bg-lime/10"
                : "border-ink-3 hover:border-lime/40")
            }
          >
            <span className="absolute right-4 top-4 font-mono text-[9px] text-paper/20">
              {i + 1}
            </span>
            <div className="font-mono text-xs uppercase tracking-widest2 text-paper">
              {opt.label}
            </div>
            <div className="mt-1 text-sm text-paper/50">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
