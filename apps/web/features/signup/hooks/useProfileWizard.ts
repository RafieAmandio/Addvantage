"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { saveTraderProfile } from "@/features/auth/actions";
import { useAppState } from "@/lib/state";
import {
  FAULT_OPTIONS,
  MARKETS,
  PROFITABLE_PERIODS,
  TRADING_LENGTHS,
  type ProfileForm,
} from "@/features/signup/types";

const INITIAL_FORM: ProfileForm = {
  tradingLength: "",
  longestProfitable: "",
  markets: [],
  yearlyGoal: "",
  faultAttribution: "",
};

export function useProfileWizard() {
  const router = useRouter();
  const { setTraderProfile, operatorName } = useAppState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM);

  const toggleMarket = useCallback((m: string) => {
    setForm((prev) => ({
      ...prev,
      markets: prev.markets.includes(m)
        ? prev.markets.filter((x) => x !== m)
        : [...prev.markets, m],
    }));
  }, []);

  const canAdvance =
    step === 0
      ? form.tradingLength !== "" && form.longestProfitable !== ""
      : step === 1
      ? form.markets.length > 0 && form.yearlyGoal.trim().length > 0
      : form.faultAttribution !== "";

  const next = useCallback(() => {
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
          Sentry.captureMessage("saveTraderProfile failed", {
            level: "warning",
            extra: { error: res.error },
          });
        }
      })
      .catch((err: unknown) => {
        Sentry.captureException(err, {
          tags: { scope: "signup.saveTraderProfile" },
        });
      });

    router.push("/app");
  }, [step, form, operatorName, router, setTraderProfile]);

  const back = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const goToStep = useCallback(
    (i: number) => {
      if (i < step) setStep(i);
    },
    [step]
  );

  const skip = useCallback(() => {
    router.push("/app");
  }, [router]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && canAdvance) {
        e.preventDefault();
        next();
        return;
      }

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
    },
    [step, form, canAdvance, toggleMarket, next]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    step,
    form,
    setForm,
    toggleMarket,
    canAdvance,
    next,
    back,
    skip,
    goToStep,
  };
}
