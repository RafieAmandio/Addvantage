"use client";

import { Button } from "@/components/ui/Button";
import { SectionNumber } from "@/components/ui/Marker";
import { StepExperience } from "@/features/signup/components/StepExperience";
import { StepMarketsGoal } from "@/features/signup/components/StepMarketsGoal";
import { StepPhilosophy } from "@/features/signup/components/StepPhilosophy";
import { useProfileWizard } from "@/features/signup/hooks/useProfileWizard";

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
    <main className="stagger relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-12 sm:px-6 sm:py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="05 /" label="TRADER PROFILE" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-white">
          Tailoring
          <br />
          your <span className="italic text-brand">terminal.</span>
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-white/60">
          Five questions. Your answers shape how the platform thinks about you —
          what it surfaces, how it speaks, what it assumes you already know.
        </p>

        <div className="mt-12 flex items-center gap-4">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className="group flex items-center gap-2 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              disabled={i > step}
            >
              <div
                className={
                  "h-2.5 w-2.5 rounded-full transition-all " +
                  (i === step
                    ? "bg-brand scale-125"
                    : i < step
                    ? "bg-moss"
                    : "bg-white/20")
                }
              />
              <span
                className={
                  "font-mono text-[9px] uppercase tracking-widest2 " +
                  (i === step
                    ? "text-brand"
                    : i < step
                    ? "text-white/50"
                    : "text-white/20")
                }
              >
                {i + 1}/3
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          Use number keys (1-4) to select · Enter to advance
        </p>
      </div>

      <div className="col-span-12 border border-gray-3 p-10 lg:col-span-7">
        {step === 0 && <StepExperience form={form} setForm={setForm} />}
        {step === 1 && (
          <StepMarketsGoal
            form={form}
            setForm={setForm}
            toggleMarket={toggleMarket}
          />
        )}
        {step === 2 && <StepPhilosophy form={form} setForm={setForm} />}

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand disabled:opacity-30 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={skip}
              className="font-mono text-[10px] uppercase tracking-widest2 text-white/30 hover:text-white/60 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Skip for now
            </button>
            <Button onClick={next} disabled={!canAdvance} size="lg">
              {step < 2 ? "Continue →" : "Enter terminal →"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
