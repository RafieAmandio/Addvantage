"use client";

import { FAULT_OPTIONS, type ProfileForm } from "@/features/signup/types";
import { Choice, questionEyebrow, questionTitle } from "./Choice";

type Props = {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
};

export function StepPhilosophy({ form, setForm }: Props) {
  return (
    <div>
      <p className={questionEyebrow}>Question 5 · Philosophy check</p>
      <h2 className={questionTitle}>The accountability question</h2>
      <p className="mt-3 rounded-xl bg-raised p-4 text-[15px] leading-[22px] text-white">
        If analyst Vantage gives trade ideas and you take the same trade and lose, whose fault is it?
      </p>
      <p className="mt-2 text-[13px] text-white/55">
        There is no wrong answer. Your response helps us calibrate how we communicate with you.
      </p>
      <div className="mt-4 space-y-2">
        {FAULT_OPTIONS.map((opt) => (
          <Choice
            key={opt.value}
            selected={form.faultAttribution === opt.value}
            onClick={() => setForm({ ...form, faultAttribution: opt.value })}
            className="w-full"
          >
            <div className="font-medium text-white">{opt.label}</div>
            <div className="mt-0.5 text-[13px] text-white/55">{opt.desc}</div>
          </Choice>
        ))}
      </div>
    </div>
  );
}
