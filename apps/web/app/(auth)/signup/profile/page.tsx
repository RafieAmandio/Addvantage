"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { saveTraderProfile } from "@/features/auth/actions";
import { useAppState } from "@/lib/state";

const TRADING_LENGTHS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-3", label: "1 — 3 years" },
  { value: "3-5", label: "3 — 5 years" },
  { value: "5+", label: "5+ years" },
] as const;

const PROFITABLE_PERIODS = [
  { value: "1week", label: "1 week" },
  { value: "1month", label: "1 month" },
  { value: "1year", label: "1 year" },
  { value: "3year+", label: "3 years+" },
] as const;

const MARKETS = [
  { value: "indo", label: "Indonesian market" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "us", label: "US markets" },
] as const;

const FAULT_OPTIONS = [
  {
    value: "vantage",
    label: "Vantage's fault",
    desc: "The analyst gave me the idea. They should have been right.",
  },
  {
    value: "me",
    label: "My fault",
    desc: "I chose to take the trade. The decision was mine.",
  },
  {
    value: "market",
    label: "The market's fault",
    desc: "Nobody could have predicted that move. It was random.",
  },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { setTraderProfile, operatorName } = useAppState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    tradingLength: "",
    longestProfitable: "",
    markets: [] as string[],
    yearlyGoal: "",
    faultAttribution: "",
  });

  const toggleMarket = (m: string) => {
    setForm((prev) => ({
      ...prev,
      markets: prev.markets.includes(m)
        ? prev.markets.filter((x) => x !== m)
        : [...prev.markets, m],
    }));
  };

  const canAdvance =
    step === 0
      ? form.tradingLength !== "" && form.longestProfitable !== ""
      : step === 1
      ? form.markets.length > 0 && form.yearlyGoal.trim().length > 0
      : form.faultAttribution !== "";

  const next = () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    const trimmedGoal = form.yearlyGoal.trim();
    setTraderProfile({
      tradingLength: form.tradingLength,
      longestProfitable: form.longestProfitable,
      markets: form.markets,
      yearlyGoal: trimmedGoal,
      faultAttribution: form.faultAttribution,
    });

    // Fire-and-route: persist to Supabase in the background; localStorage is
    // our fallback so a transient server error shouldn't block entry.
    const fd = new FormData();
    if (operatorName && operatorName !== "Operator") {
      fd.set("handle", operatorName);
    }
    fd.set("tradingLength", form.tradingLength);
    fd.set("longestProfitable", form.longestProfitable);
    for (const m of form.markets) fd.append("markets", m);
    fd.set("yearlyGoal", trimmedGoal);
    fd.set("faultAttribution", form.faultAttribution);

    void saveTraderProfile({ ok: false }, fd)
      .then((res) => {
        if (!res.ok) {
          console.warn("saveTraderProfile failed", res.error);
        }
      })
      .catch((err: unknown) => {
        console.warn("saveTraderProfile threw", err);
      });

    router.push("/app");
  };

  const skip = () => {
    router.push("/app");
  };

  // Keyboard navigation: number keys to select tiles
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (isNaN(num) || num < 1) return;

      if (step === 0) {
        if (num <= TRADING_LENGTHS.length && !form.longestProfitable) {
          setForm((prev) => ({
            ...prev,
            tradingLength: TRADING_LENGTHS[num - 1].value,
          }));
        } else if (num <= PROFITABLE_PERIODS.length && form.tradingLength) {
          setForm((prev) => ({
            ...prev,
            longestProfitable: PROFITABLE_PERIODS[num - 1].value,
          }));
        }
      } else if (step === 1 && num <= MARKETS.length) {
        toggleMarket(MARKETS[num - 1].value);
      } else if (step === 2 && num <= FAULT_OPTIONS.length) {
        setForm((prev) => ({
          ...prev,
          faultAttribution: FAULT_OPTIONS[num - 1].value,
        }));
      }

      if (e.key === "Enter" && canAdvance) {
        e.preventDefault();
        next();
      }
    },
    [step, form, canAdvance]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <main className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20">
      {/* Left column — context + progress */}
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="05 /" label="TRADER PROFILE" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-paper">
          Tailoring
          <br />
          your{" "}
          <span className="italic text-lime">terminal.</span>
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
              onClick={() => i < step && setStep(i)}
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
        {/* Step 1: Experience + Profitable Period */}
        {step === 0 && (
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
        )}

        {/* Step 2: Markets + Yearly Goal */}
        {step === 1 && (
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
                onChange={(e) =>
                  setForm({ ...form, yearlyGoal: e.target.value })
                }
                placeholder="e.g. 30% annual return, consistent 2R average, survive the year without blowing up"
                className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg text-paper placeholder:text-paper/20 outline-none focus:border-lime"
              />
            </div>
          </div>
        )}

        {/* Step 3: Philosophy Check */}
        {step === 2 && (
          <div className="space-y-6 stagger">
            <DataLabel>Question 05 / Philosophy check</DataLabel>
            <h2 className="font-display text-3xl text-paper">
              The accountability question.
            </h2>
            <div className="border border-lime/40 bg-lime/5 p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest2 text-paper/80">
                If analyst Vantage gives trade ideas and you take the same trade
                and lose — whose fault is it?
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
                  onClick={() =>
                    setForm({ ...form, faultAttribution: opt.value })
                  }
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
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
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
