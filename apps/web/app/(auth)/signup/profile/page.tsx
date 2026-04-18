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
    <main className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20">
      {/* Left column — context + progress */}
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="05 /" label="TRADER PROFILE" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-paper">
          Tailoring
          <br />
          your <span className="italic text-lime">terminal.</span>
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-paper/60">
          Five questions. Your answers shape how the platform thinks about you —
          what it surfaces, how it speaks, what it assumes you already know.
        </p>

        {/* Progress dots */}
        <div className="mt-12 flex items-center gap-4">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className="group flex items-center gap-2"
              disabled={i > step}
            >
              <div
                className={
                  "h-2.5 w-2.5 rounded-full transition-all " +
                  (i === step
                    ? "bg-lime scale-125"
                    : i < step
                    ? "bg-moss"
                    : "bg-paper/20")
                }
              />
              <span
                className={
                  "font-mono text-[9px] uppercase tracking-widest2 " +
                  (i === step
                    ? "text-lime"
                    : i < step
                    ? "text-paper/50"
                    : "text-paper/20")
                }
              >
                {i + 1}/3
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          Use number keys (1-4) to select · Enter to advance
        </p>
      </div>

      {/* Right column — form */}
      <div className="col-span-12 border border-ink-3 bg-ink-2/40 p-10 lg:col-span-7">
        {step === 0 && <StepExperience form={form} setForm={setForm} />}
        {step === 1 && (
          <StepMarketsGoal
            form={form}
            setForm={setForm}
            toggleMarket={toggleMarket}
          />
        )}
        {step === 2 && <StepPhilosophy form={form} setForm={setForm} />}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-lime disabled:opacity-30"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={skip}
              className="font-mono text-[10px] uppercase tracking-widest2 text-paper/30 hover:text-paper/60 transition-colors"
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
