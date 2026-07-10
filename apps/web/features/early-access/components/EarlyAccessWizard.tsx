"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/api/client";
import { isMockMode } from "@/lib/config/public";
import {
  submitEarlyAccessApplication,
  startEarlyAccessLead,
} from "@/features/early-access/actions";
import {
  STEPS,
  ACK_ITEMS,
  PARTNER_BROKERS,
  BROKER_COPY,
  CASHBACK,
  PAYMENT_DESTINATIONS,
  CONFIRMATION,
} from "@/features/early-access/content";

type PaymentMethod = "usdt" | "bca";

interface FormState {
  email: string;
  telegramHandle: string;
  wantsCashback: boolean | null;
  broker: string;
  brokerAccountRef: string;
  acks: Record<string, boolean>;
  signedName: string;
  paymentMethod: PaymentMethod | null;
  proofImageUrl: string;
}

const INITIAL: FormState = {
  email: "",
  telegramHandle: "",
  wantsCashback: null,
  broker: "",
  brokerAccountRef: "",
  acks: { risk: false, ownResearch: false, noGuarantee: false, terms: false },
  signedName: "",
  paymentMethod: null,
  proofImageUrl: "",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black shadow-none outline-none transition-all duration-300 placeholder:text-black/30 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)]";
const labelClass = "block font-mono text-sm font-bold text-black";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikeFullName(v: string) {
  const t = v.trim();
  return t.length >= 5 && /\s/.test(t) && /^[\p{L}\s.'-]+$/u.test(t);
}

export function EarlyAccessWizard() {
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [website, setWebsite] = useState(""); // honeypot
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leadPending, setLeadPending] = useState(false);
  const [returning, setReturning] = useState<"draft" | "submitted" | null>(null);
  const [done, setDone] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => setMounted(true), []);

  // Slow background drift on the left panel (parity with the signup flow).
  // Skipped entirely when the user prefers reduced motion, and paused while the
  // tab is hidden so it never burns cycles in the background.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let frame: number;
    let t = 0;
    const drift = () => {
      if (document.hidden) {
        frame = requestAnimationFrame(drift);
        return;
      }
      t += 0.001;
      if (imgRef.current) {
        const x = Math.sin(t) * 8;
        const y = Math.cos(t * 0.7) * 5;
        imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      }
      frame = requestAnimationFrame(drift);
    };
    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const advanceStep = (next: number) => {
    setStep(next);
    setStepKey((k) => k + 1);
  };

  const nameOk = looksLikeFullName(form.signedName);
  const allAcked = ACK_ITEMS.every((a) => form.acks[a.key]);
  const lastStep = STEPS.length - 1;

  const canContinue = [
    EMAIL_RE.test(form.email.trim()) && form.telegramHandle.trim().length >= 3,
    form.wantsCashback !== null,
    allAcked && nameOk,
    form.paymentMethod !== null && form.proofImageUrl !== "" && !uploading,
  ][step];

  async function onProofSelected(file: File) {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(URL.createObjectURL(file));
    setUploadError(null);
    setUploading(true);
    set("proofImageUrl", "");
    try {
      if (isMockMode()) {
        await new Promise((r) => setTimeout(r, 700));
        set("proofImageUrl", `mock://proof/${encodeURIComponent(file.name)}`);
      } else {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`${API_BASE}/early-access/upload-proof`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { data: { imageUrl: string } };
        set("proofImageUrl", json.data.imageUrl);
      }
    } catch {
      setUploadError("We couldn't upload that file. Use a PNG, JPG or WEBP under 5 MB.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitEarlyAccessApplication({
      email: form.email,
      telegramHandle: form.telegramHandle,
      wantsCashback: form.wantsCashback,
      broker: form.broker || undefined,
      brokerAccountRef: form.brokerAccountRef || undefined,
      signedName: form.signedName,
      acknowledgements: form.acks,
      paymentMethod: form.paymentMethod,
      proofImageUrl: form.proofImageUrl,
      website,
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setSubmitError("We couldn't submit your application. Please try again.");
  }

  async function handleContinue() {
    if (!canContinue) return;

    // Identity step: persist the lead and restore any existing draft.
    if (step === 0) {
      setLeadPending(true);
      const res = await startEarlyAccessLead({
        email: form.email,
        telegramHandle: form.telegramHandle,
      });
      setLeadPending(false);

      const a = res.application;
      if (res.ok && a) {
        setForm((f) => ({
          ...f,
          wantsCashback: a.wantsCashback ?? f.wantsCashback,
          broker: a.broker ?? f.broker,
          brokerAccountRef: a.brokerAccountRef ?? f.brokerAccountRef,
          signedName: a.signedName ?? f.signedName,
          acks: a.acknowledgements ?? f.acks,
          paymentMethod: (a.paymentMethod as PaymentMethod | null) ?? f.paymentMethod,
          proofImageUrl: a.proofImageUrl ?? f.proofImageUrl,
        }));
        if (a.proofImageUrl) setProofPreview(a.proofImageUrl);
        const hasProgress =
          a.wantsCashback !== null || !!a.signedName || !!a.paymentMethod || !!a.proofImageUrl;
        setReturning(res.status === "pending" ? "submitted" : hasProgress ? "draft" : null);
      }
      advanceStep(1);
      return;
    }

    advanceStep(step + 1);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 md:h-screen md:grid-cols-[1fr_2fr] md:overflow-hidden">
      {/* Left — dark branding panel */}
      <div className="relative flex flex-col overflow-hidden bg-gray px-6 pb-12 pt-20 md:px-12 md:pb-16">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src="/figma/login-bg.png"
            alt=""
            className="h-full w-full object-cover opacity-20 mix-blend-lighten will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        </div>

        <div
          className="relative z-10 flex items-center justify-between transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-12px)" }}
        >
          <Link href="/" className="font-mono text-base font-bold text-white">
            +vantage
          </Link>
        </div>

        <div
          className="relative z-10 mt-4 flex items-baseline gap-3 font-mono text-sm transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: "200ms" }}
        >
          <span className="font-bold text-brand">00 /</span>
          <span className="h-px flex-1 bg-brand/40" />
          <span className="font-bold text-white">Early Access</span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="font-sans text-[clamp(2.5rem,7vw,72px)] font-bold leading-[0.95] text-white">
            {["This is", "early access,", "not a waitlist."].map((line, i) => (
              <span
                key={line}
                className="block transition-all duration-700"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                {i === 1 ? <Redact>{line}</Redact> : line}
              </span>
            ))}
          </h1>
          <p
            className="mt-6 max-w-sm font-mono text-sm font-light leading-[1.5] text-white/60 transition-all duration-700"
            style={{ opacity: mounted ? 1 : 0, transitionDelay: "800ms" }}
          >
            Your details, the cashback offer, the waiver, then payment. Access is issued by hand, not automated.
          </p>
        </div>

        <div className="relative z-10 mt-12 space-y-2">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "flex items-center gap-3 font-mono text-xs transition-all duration-300",
                done || i < step ? "text-white/50" : i === step ? "text-brand" : "text-white/20",
              )}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-16px)",
                transitionDelay: `${900 + i * 80}ms`,
              }}
            >
              <span className="font-bold">{s.n}</span>
              <span
                className="h-px flex-1 bg-current transition-all duration-500"
                style={{
                  opacity: done || i <= step ? 0.6 : 0.15,
                  transform: done || i <= step ? "scaleX(1)" : "scaleX(0.4)",
                  transformOrigin: "left",
                }}
              />
              <span>{s.label}</span>
              {!done && i === step && <span className="led animate-pulse" aria-hidden />}
            </div>
          ))}
        </div>
      </div>

      {/* Right — white form panel (scrolls independently when content is tall) */}
      <div className="flex flex-col bg-white px-6 md:h-screen md:overflow-y-auto md:px-12">
        <div className="m-auto w-full max-w-md py-16">
        {done ? (
          <ConfirmationPanel />
        ) : (
          <div key={stepKey} className="w-full">
            {returning && (
              <p
                role="status"
                className={cn(
                  "mb-6 rounded-lg border px-4 py-3 font-mono text-xs leading-[1.5]",
                  returning === "submitted"
                    ? "border-brand/50 bg-brand/5 text-black"
                    : "border-gray-3 bg-white-2 text-black/60",
                )}
              >
                {returning === "submitted"
                  ? "You've already applied with this email. Finishing again updates your submission."
                  : "Welcome back. We restored what you filled in before."}
              </p>
            )}
            {step === 0 && (
              <StepShell n="01" label="Identity" title="Request access">
                <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                  <label htmlFor="ea-email" className={labelClass}>
                    Email you&apos;ll use for access
                  </label>
                  <input
                    id="ea-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    aria-required
                    aria-invalid={form.email.length > 0 && !EMAIL_RE.test(form.email.trim())}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@domain.com"
                    className={inputClass}
                  />
                </div>
                <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.3s both" }}>
                  <label htmlFor="ea-telegram" className={labelClass}>Telegram handle</label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base text-black/60">
                      @
                    </span>
                    <input
                      id="ea-telegram"
                      type="text"
                      autoComplete="off"
                      required
                      aria-required
                      value={form.telegramHandle}
                      onChange={(e) => set("telegramHandle", e.target.value.replace(/^@+/, ""))}
                      placeholder="handle"
                      className={cn(inputClass, "mt-0 pl-9")}
                    />
                  </div>
                </div>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell n="02" label="Cashback" title="The cashback program">
                <p
                  className="font-mono text-sm text-black/60"
                  style={{ animation: "fadeSlideUp 0.4s ease-out 0.15s both" }}
                >
                  Opt into the 100% money-back guarantee, or take early access on its own. Either way, the next steps are the same.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                  <Choice
                    active={form.wantsCashback === true}
                    onClick={() => set("wantsCashback", true)}
                    title="Yes, the guarantee"
                    sub="100% back in USDT after 1 year"
                  />
                  <Choice
                    active={form.wantsCashback === false}
                    onClick={() => set("wantsCashback", false)}
                    title="No, just access"
                    sub="Skip the commitment"
                  />
                </div>

                {form.wantsCashback === true && (
                  <div
                    className="space-y-4 rounded-lg border border-gray-3 bg-white-2 p-5 font-mono text-sm leading-[1.6] text-black/60"
                    style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
                  >
                    <p className="text-base font-bold text-black">{CASHBACK.headline}</p>
                    <div>
                      <p className="mb-2 font-bold text-black">How to qualify</p>
                      <ol className="space-y-2">
                        {CASHBACK.qualify.map((q, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center bg-brand text-[11px] font-bold text-black">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <p>{CASHBACK.close}</p>
                  </div>
                )}

                {form.wantsCashback !== null && (
                  <div className="space-y-4" style={{ animation: "fadeSlideUp 0.4s ease-out both" }}>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest2 text-black/60">
                        Partner brokers
                      </p>
                      <p className="mt-2 font-mono text-sm leading-[1.5] text-black/60">{BROKER_COPY}</p>
                    </div>
                    <div className="divide-y divide-gray-3 overflow-hidden rounded-lg border border-gray-3">
                      {PARTNER_BROKERS.map((b) => (
                        <a
                          key={b.name}
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 p-4 transition-colors duration-200 hover:bg-black/[0.03]"
                        >
                          <BrokerLogo name={b.name} logoUrl={b.logoUrl} />
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-sm font-bold text-black">{b.name}</span>
                            <span className="block font-mono text-xs text-black/60">{b.kind}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest2 text-black/60 transition-colors group-hover:text-black">
                            Register
                            <span className="transition-transform duration-200 group-hover:translate-x-0.5">↗</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </StepShell>
            )}

            {step === 2 && (
              <StepShell n="03" label="Waiver" title="Liability waiver">
                <p
                  className="font-mono text-sm text-black/60"
                  style={{ animation: "fadeSlideUp 0.4s ease-out 0.15s both" }}
                >
                  Read every line. This is binding. Tick all four, then sign with your full legal name.
                </p>
                <div className="space-y-3" style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                  {ACK_ITEMS.map((a) => (
                    <label
                      key={a.key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                        form.acks[a.key] ? "border-brand bg-brand/5" : "border-gray-3 hover:border-black/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.acks[a.key]}
                        onChange={(e) => set("acks", { ...form.acks, [a.key]: e.target.checked })}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                      />
                      <span className="font-mono text-sm leading-[1.5] text-black/70">{a.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.3s both" }}>
                  <label htmlFor="ea-signature" className={labelClass}>
                    Sign by typing your full legal name
                  </label>
                  <input
                    id="ea-signature"
                    type="text"
                    required
                    aria-required
                    aria-invalid={form.signedName.length > 0 && !nameOk}
                    aria-describedby={
                      form.signedName.length > 0 && !nameOk ? "ea-signature-error" : undefined
                    }
                    value={form.signedName}
                    onChange={(e) => set("signedName", e.target.value)}
                    placeholder="Your full legal name"
                    className={cn(
                      "mt-2 w-full rounded-lg border px-4 py-3 font-serif text-2xl italic outline-none transition-colors",
                      form.signedName.length > 0 && !nameOk
                        ? "border-blood-bright bg-blood/5 text-blood-bright"
                        : nameOk
                          ? "border-moss bg-moss/5 text-black"
                          : "border-gray-3 bg-white-2 text-black placeholder:text-black/30 focus-visible:border-brand",
                    )}
                  />
                  {form.signedName.length > 0 && !nameOk && (
                    <p id="ea-signature-error" className="mt-2 font-mono text-xs text-blood-bright">
                      Type your full legal name, first and last.
                    </p>
                  )}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell n="04" label="Payment" title="Payment">
                <p
                  className="font-mono text-sm text-black/60"
                  style={{ animation: "fadeSlideUp 0.4s ease-out 0.15s both" }}
                >
                  One upfront payment secures your place. USDT is the cheaper option. Transfer, then upload your receipt.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                  <Choice
                    active={form.paymentMethod === "usdt"}
                    onClick={() => set("paymentMethod", "usdt")}
                    title={PAYMENT_DESTINATIONS.usdt.amountLabel}
                    sub="USDT, cheapest"
                  />
                  <Choice
                    active={form.paymentMethod === "bca"}
                    onClick={() => set("paymentMethod", "bca")}
                    title={PAYMENT_DESTINATIONS.bca.amountLabel}
                    sub="Bank transfer, BCA"
                  />
                </div>

                {form.paymentMethod && (
                  <div className="space-y-5" style={{ animation: "fadeSlideUp 0.4s ease-out both" }}>
                    <PaymentDetails method={form.paymentMethod} />
                    <ProofUpload
                      preview={proofPreview}
                      uploading={uploading}
                      uploaded={form.proofImageUrl !== ""}
                      error={uploadError}
                      onSelect={onProofSelected}
                    />
                  </div>
                )}
              </StepShell>
            )}

            {submitError && (
              <p role="alert" className="mt-6 animate-[shake_0.3s_ease-out] font-mono text-sm text-blood-bright">
                ● {submitError}
              </p>
            )}

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {/* Nav */}
            <div className="mt-10 flex items-center justify-between" style={{ animation: "fadeSlideUp 0.4s ease-out 0.4s both" }}>
              <button
                type="button"
                onClick={() => step > 0 && advanceStep(step - 1)}
                disabled={step === 0}
                className="-ml-2 min-h-[44px] px-2 py-3 font-mono text-sm text-black/60 transition-all duration-200 hover:text-black disabled:opacity-0"
              >
                &larr; Back
              </button>
              {step < lastStep ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue || leadPending}
                  className="btn-pixel flex items-center gap-2.5 rounded-lg bg-brand px-6 py-3 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.97] disabled:opacity-40"
                >
                  {leadPending ? (
                    <>
                      <span
                        aria-hidden
                        className="inline-block h-4 w-4 shrink-0 border-2 border-black/25 border-t-black"
                        style={{ animation: "btnSpin 0.7s steps(8) infinite" }}
                      />
                      Saving
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canContinue || submitting}
                  className="btn-pixel flex items-center gap-2.5 rounded-lg bg-brand px-6 py-3 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.97] disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <span
                        aria-hidden
                        className="inline-block h-4 w-4 shrink-0 border-2 border-black/25 border-t-black"
                        style={{ animation: "btnSpin 0.7s steps(8) infinite" }}
                      />
                      Submitting
                    </>
                  ) : (
                    "Submit application"
                  )}
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === step ? "w-6 bg-black" : i < step ? "w-2 bg-brand" : "w-2 bg-black/20",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-xs text-black/60">
              ({step + 1}/{STEPS.length}) {STEPS[step]?.label}
            </p>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

// The headline accent, "declassified": white text sits under a solid black
// redaction bar that holds, gets scanned, then wipes off to the right on load.
function Redact({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block text-white">
      {children}
      <span
        aria-hidden
        className="absolute inset-x-[-0.1em] top-[0.08em] bottom-[0.14em] origin-right overflow-hidden bg-black"
        style={{ animation: "declassify 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
      >
        <span
          className="absolute inset-y-0 -left-8 w-8 bg-white/60 blur-md"
          style={{ animation: "redactScan 1.2s ease-out 0.5s both" }}
        />
      </span>
    </span>
  );
}

// Real broker logo when we have one (Supabase-stored), else a clean monogram.
function BrokerLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={40}
        height={40}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-lg border border-gray-3 bg-white object-contain p-1.5"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-3 bg-black/[0.04] font-mono text-base font-bold text-black">
      {name.charAt(0)}
    </span>
  );
}

function StepShell({
  n,
  label,
  title,
  children,
}: {
  n: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <p className="font-mono text-sm text-black/60" style={{ animation: "fadeSlideUp 0.4s ease-out both" }}>
        Step {n} / {label}
      </p>
      <h2 className="font-mono text-xl font-bold text-black" style={{ animation: "fadeSlideUp 0.4s ease-out 0.1s both" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-all duration-200 active:scale-[0.98]",
        active ? "border-brand bg-brand/5 shadow-[0_0_0_3px_rgba(255,212,0,0.15)]" : "border-gray-3 hover:border-black/40 hover:bg-black/[0.02]",
      )}
    >
      <span className="flex items-center gap-2 font-mono text-sm font-bold text-black">
        <span className={cn("led", !active && "opacity-30")} aria-hidden />
        {title}
      </span>
      <span className="pl-4 font-mono text-xs text-black/60">{sub}</span>
    </button>
  );
}

function PaymentDetails({ method }: { method: PaymentMethod }) {
  const dest = PAYMENT_DESTINATIONS[method];
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable; user can select manually */
    }
  };

  return (
    <div className="rounded-lg border border-gray-3 bg-white-2 p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-black/60">{dest.method}</span>
        <span className="font-mono text-lg font-bold text-black">{dest.amountLabel}</span>
      </div>
      <div className="mt-4 space-y-1">
        {dest.rows.map((row) => {
          const copyable = "copyable" in row && row.copyable;
          if (copyable) {
            // Full-row tap target (>=44px) so the wallet / account number is easy
            // to copy on touch, where a tiny button would be fiddly and risky.
            return (
              <button
                key={row.label}
                type="button"
                onClick={() => copy(row.value)}
                className="group -mx-2 flex min-h-[44px] w-full items-start justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-black/[0.05]"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-black/60">{row.label}</span>
                <span className="flex items-start gap-2">
                  <span className="break-all text-right font-mono text-sm text-black">{row.value}</span>
                  <span className="mt-px shrink-0 font-mono text-[10px] uppercase tracking-widest2 text-black/60 transition-colors group-hover:text-black">
                    {copied === row.value ? "Copied" : "Copy"}
                  </span>
                </span>
              </button>
            );
          }
          return (
            <div key={row.label} className="flex items-center justify-between gap-4 px-0 py-2">
              <span className="font-mono text-xs text-black/60">{row.label}</span>
              <span className="break-all text-right font-mono text-sm text-black">{row.value}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-xs leading-[1.5] text-black/60">{dest.note}</p>
    </div>
  );
}

function ProofUpload({
  preview,
  uploading,
  uploaded,
  error,
  onSelect,
}: {
  preview: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
  onSelect: (file: File) => void;
}) {
  return (
    <div>
      <p className={labelClass}>Proof of payment</p>
      <label
        className={cn(
          "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          uploaded ? "border-moss bg-moss/5" : "border-gray-3 hover:border-brand hover:bg-black/[0.02]",
        )}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Payment proof preview" className="max-h-40 rounded border border-gray-3 object-contain" />
        ) : (
          <span className="font-mono text-2xl text-black/30">↑</span>
        )}
        <span className="font-mono text-xs text-black/60">
          {uploading
            ? "Uploading your receipt..."
            : uploaded
              ? "Receipt attached. Click to replace."
              : "Upload a screenshot of your transfer. PNG, JPG or WEBP, max 5 MB."}
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-2 font-mono text-xs text-blood-bright">
          {error}
        </p>
      )}
    </div>
  );
}

function ConfirmationPanel() {
  return (
    <div className="w-full max-w-md text-center" style={{ animation: "fadeSlideUp 0.5s ease-out both" }}>
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">● Application received</div>
      <h2 className="mt-5 font-sans text-[clamp(2rem,6vw,44px)] font-bold leading-[1.02] text-black">
        You&apos;re in.
      </h2>
      <p className="mx-auto mt-4 max-w-sm font-mono text-sm leading-[1.6] text-black/60">
        Welcome aboard, operator. You&apos;re locked in as a founding early-access member.
      </p>
      <div className="mt-8 space-y-2 rounded-lg border border-gray-3 bg-white-2 p-5 text-left font-mono text-sm">
        <div className="flex items-center justify-between">
          <span className="text-black/60">Bonus</span>
          <span className="font-bold text-black">+{CONFIRMATION.bonusMonths} months access</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-black/60">Subscription starts</span>
          <span className="font-bold text-black">{CONFIRMATION.subscriptionStart}</span>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-sm font-mono text-sm leading-[1.6] text-black/60">
        We&apos;re verifying your payment and broker details now. Your access instructions land in your inbox by{" "}
        <span className="font-bold text-black">{CONFIRMATION.accessEmailDate}</span>. Nothing else needed until then.
      </p>
      <Link href="/" className="mt-8 inline-block font-mono text-sm text-black/60 transition-colors hover:text-brand">
        &larr; Back to TradeVantage
      </Link>
    </div>
  );
}
