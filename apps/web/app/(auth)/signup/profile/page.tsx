"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { AuthShell, authEyebrow } from "@/features/auth/components/AuthShell";
import { StepExperience } from "@/features/signup/components/StepExperience";
import { StepMarketsGoal } from "@/features/signup/components/StepMarketsGoal";
import { StepPhilosophy } from "@/features/signup/components/StepPhilosophy";
import { useProfileWizard } from "@/features/signup/hooks/useProfileWizard";

const STEP_LABELS = ["Experience", "Markets and goal", "Philosophy"];

export default function ProfilePage() {
  const {
    step,
    form,
    setForm,
    toggleMarket,
    canAdvance,
    next,
    back,
    skip,
    goToStep,
  } = useProfileWizard();

  return (
    <AuthShell width="lg" footer={<>Use number keys (1 to 4) to select, Enter to advance.</>}>
      <p className={authEyebrow}>Trader profile</p>
      <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Tailor your terminal</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-white/55">
        Five questions. Your answers shape what the platform surfaces, how it speaks, and what it
        assumes you already know.
      </p>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => goToStep(i)}
            disabled={i > step}
            className={cn(
              "rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              i === step ? "font-medium text-white" : i < step ? "text-white/55 hover:text-white" : "text-white/30"
            )}
          >
            <span className={cn("font-num", i === step && "text-brand")}>{i + 1}</span> {label}
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-white/[0.07] pt-6">
        {step === 0 && <StepExperience form={form} setForm={setForm} />}
        {step === 1 && (
          <StepMarketsGoal
            form={form}
            setForm={setForm}
            toggleMarket={toggleMarket}
          />
        )}
        {step === 2 && <StepPhilosophy form={form} setForm={setForm} />}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={step === 0}
          className="h-11 rounded-full px-4 text-[14px] text-white/55 transition-colors hover:bg-raised hover:text-white disabled:invisible"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={skip}
            className="h-11 rounded-full px-4 text-[14px] text-white/40 transition-colors hover:bg-raised hover:text-white"
          >
            Skip for now
          </button>
          <Button onClick={next} disabled={!canAdvance} className="h-11">
            {step < 2 ? "Continue" : "Enter terminal"}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
