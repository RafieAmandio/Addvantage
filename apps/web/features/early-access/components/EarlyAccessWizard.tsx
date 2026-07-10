"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/api/client";
import { isMockMode } from "@/lib/config/public";
import { ScrambleReveal } from "@/features/marketing/components/ScrambleReveal";
import { submitEarlyAccessApplication } from "@/features/early-access/actions";
import {
  STEPS,
  ACK_ITEMS,
  BROKER_OPTIONS,
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
  "mt-2 w-full rounded-lg border border-wire bg-black-2 px-4 py-3 font-mono text-base text-white outline-none transition-colors placeholder:text-white/25 focus-visible:border-brand";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikeFullName(v: string) {
  const t = v.trim();
  return t.length >= 5 && /\s/.test(t) && /^[\p{L}\s.'-]+$/u.test(t);
}

export function EarlyAccessWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [website, setWebsite] = useState(""); // honeypot
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const nameOk = looksLikeFullName(form.signedName);
  const allAcked = ACK_ITEMS.every((a) => form.acks[a.key]);

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
      setUploadError("Upload failed. Check the file and try again.");
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
    else setSubmitError("Something went wrong. Please try again.");
  }

  if (done) return <Confirmation />;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 md:py-12">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="font-mono text-base font-bold text-white">
            +vantage
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Early Access // Classified
          </span>
        </div>

        {/* Stepper */}
        <div className="mt-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "font-mono text-[10px] font-bold tabular-nums",
                  i === step
                    ? "text-brand"
                    : i < step
                      ? "text-white/50"
                      : "text-white/20",
                )}
              >
                {s.n}
              </span>
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  i < step ? "bg-brand/60" : i === step ? "bg-brand/40" : "bg-white/10",
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 font-mono text-xs">
          <span className="led" aria-hidden />
          <span className="text-white/50">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-white/30">/</span>
          <span className="font-bold text-white">{STEPS[step]?.label}</span>
        </div>

        {/* Step body */}
        <div key={step} className="mt-8 flex-1 animate-revealUp">
          {step === 0 && (
            <StepShell
              title="Request access"
              blurb="Two lines and you're moving. This is where your access is issued."
            >
              <Field label="Email you'll use for access">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@domain.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Telegram handle">
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base text-white/40">
                    @
                  </span>
                  <input
                    type="text"
                    value={form.telegramHandle}
                    onChange={(e) => set("telegramHandle", e.target.value.replace(/^@+/, ""))}
                    placeholder="handle"
                    className={cn(inputClass, "mt-0 pl-9")}
                  />
                </div>
              </Field>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              title="Cashback program"
              blurb="Opt into the 100% money-back guarantee, or take early access on its own. Either way, the next steps are the same."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Choice
                  active={form.wantsCashback === true}
                  onClick={() => set("wantsCashback", true)}
                  title="Yes, I want the guarantee"
                  sub="100% money back in USDT after 1 year"
                />
                <Choice
                  active={form.wantsCashback === false}
                  onClick={() => set("wantsCashback", false)}
                  title="No, just early access"
                  sub="Skip the guarantee commitment"
                />
              </div>

              {form.wantsCashback === true && (
                <div className="mt-6 animate-revealUp space-y-5 border border-wire bg-gray/40 p-5 font-mono text-sm leading-[1.6] text-white/70">
                  <p className="text-base font-bold text-white">{CASHBACK.headline}</p>
                  <p>{CASHBACK.why}</p>
                  <p>{CASHBACK.brokersNote}</p>
                  <div>
                    <p className="mb-2 font-bold text-brand">How to qualify</p>
                    <ol className="space-y-2">
                      {CASHBACK.qualify.map((q, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <p>{CASHBACK.close}</p>
                </div>
              )}

              {form.wantsCashback !== null && (
                <div className="mt-6 space-y-4 animate-revealUp">
                  <p className="font-mono text-[11px] uppercase tracking-widest2 text-white/40">
                    Partner broker (optional)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Broker you trade with">
                      <select
                        value={form.broker}
                        onChange={(e) => set("broker", e.target.value)}
                        className={cn(inputClass, "appearance-none")}
                      >
                        <option value="">Select (optional)</option>
                        {BROKER_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Account / ID reference">
                      <input
                        type="text"
                        value={form.brokerAccountRef}
                        onChange={(e) => set("brokerAccountRef", e.target.value)}
                        placeholder="optional"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title="Liability waiver"
              blurb="Read every line. This is binding. Tick all four, then sign with your full legal name."
            >
              <div className="space-y-3">
                {ACK_ITEMS.map((a) => (
                  <label
                    key={a.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                      form.acks[a.key]
                        ? "border-brand bg-brand/5"
                        : "border-wire hover:border-white/30",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.acks[a.key]}
                      onChange={(e) => set("acks", { ...form.acks, [a.key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                    />
                    <span className="font-mono text-sm leading-[1.5] text-white/70">{a.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <p className="font-mono text-sm font-bold text-white">Signature, type your full legal name</p>
                <input
                  type="text"
                  value={form.signedName}
                  onChange={(e) => set("signedName", e.target.value)}
                  placeholder="Your full legal name"
                  className={cn(
                    "mt-2 w-full rounded-lg border bg-black-2 px-4 py-3 font-serif text-2xl italic outline-none transition-colors",
                    form.signedName.length > 0 && !nameOk
                      ? "border-blood-bright text-blood-bright"
                      : nameOk
                        ? "border-moss text-white"
                        : "border-wire text-white placeholder:text-white/25 focus-visible:border-brand",
                  )}
                />
                {form.signedName.length > 0 && !nameOk && (
                  <p className="mt-2 font-mono text-xs text-blood-bright">
                    Type your full legal name, first and last.
                  </p>
                )}
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title="Payment"
              blurb="One upfront payment secures your place. USDT is the cheaper option. Transfer, then upload your receipt."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="mt-6 animate-revealUp space-y-5">
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
        </div>

        {submitError && (
          <p className="mt-4 font-mono text-sm text-blood-bright">● {submitError}</p>
        )}

        {/* Honeypot: hidden from users, tempting to bots. */}
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
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-mono text-sm text-white/50 transition-colors hover:text-white disabled:invisible"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => canContinue && setStep((s) => s + 1)}
              disabled={!canContinue}
              className="btn-pixel rounded-lg bg-brand px-8 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue || submitting}
              className="btn-pixel flex items-center gap-2.5 rounded-lg bg-brand px-8 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-40"
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
      </div>
    </main>
  );
}

function StepShell({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-sans text-[clamp(1.75rem,5vw,40px)] font-bold leading-[1.05] text-white">
        <ScrambleReveal text={title} duration={700} />
      </h1>
      <p className="mt-3 max-w-xl font-mono text-sm leading-[1.5] text-white/50">{blurb}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-5 block first:mt-0">
      <span className="block font-mono text-sm font-bold text-white">{label}</span>
      {children}
    </label>
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
        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
        active ? "border-brand bg-brand/5" : "border-wire hover:border-white/30",
      )}
    >
      <span className="flex items-center gap-2 font-mono text-base font-bold text-white">
        <span className={cn("led", !active && "opacity-30")} aria-hidden />
        {title}
      </span>
      <span className="pl-4 font-mono text-xs text-white/50">{sub}</span>
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
    <div className="border border-wire bg-gray/40 p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-white/40">
          {dest.method}
        </span>
        <span className="font-mono text-lg font-bold text-brand">{dest.amountLabel}</span>
      </div>
      <dl className="mt-4 space-y-2">
        {dest.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="font-mono text-xs text-white/40">{row.label}</dt>
            <dd className="flex items-center gap-2 font-mono text-sm text-white">
              <span className="break-all text-right">{row.value}</span>
              {"copyable" in row && row.copyable && (
                <button
                  type="button"
                  onClick={() => copy(row.value)}
                  className="shrink-0 border border-wire px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand"
                >
                  {copied === row.value ? "Copied" : "Copy"}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-mono text-xs leading-[1.5] text-white/40">{dest.note}</p>
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
      <p className="font-mono text-sm font-bold text-white">Proof of payment</p>
      <label
        className={cn(
          "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          uploaded ? "border-moss bg-moss/5" : "border-wire hover:border-brand",
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
          <img src={preview} alt="Payment proof preview" className="max-h-40 rounded border border-wire object-contain" />
        ) : (
          <span className="font-mono text-2xl text-white/30">↑</span>
        )}
        <span className="font-mono text-xs text-white/50">
          {uploading
            ? "Uploading..."
            : uploaded
              ? "Receipt attached, tap to replace"
              : "Tap to upload your transfer receipt (PNG, JPG, WEBP)"}
        </span>
      </label>
      {error && <p className="mt-2 font-mono text-xs text-blood-bright">{error}</p>}
    </div>
  );
}

function Confirmation() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-lg animate-revealUp text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Application received
        </div>
        <h1 className="mt-5 font-sans text-[clamp(2rem,7vw,52px)] font-bold leading-[1.02] text-white">
          <ScrambleReveal text="You're in." duration={800} />
        </h1>
        <p className="mx-auto mt-5 max-w-md font-mono text-sm leading-[1.6] text-white/60">
          Welcome aboard, operator. You're locked in as a founding early-access member.
        </p>
        <div className="mt-8 space-y-2 border border-wire bg-gray/40 p-5 text-left font-mono text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/40">Bonus</span>
            <span className="font-bold text-brand">+{CONFIRMATION.bonusMonths} months access</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">Subscription starts</span>
            <span className="font-bold text-white">{CONFIRMATION.subscriptionStart}</span>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-md font-mono text-sm leading-[1.6] text-white/60">
          We're verifying your payment and broker details now. Your access instructions land in your
          inbox by <span className="font-bold text-white">{CONFIRMATION.accessEmailDate}</span>. Nothing
          else needed from you until then.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block font-mono text-sm text-white/50 transition-colors hover:text-brand"
        >
          ← Back to TradeVantage
        </Link>
      </div>
    </main>
  );
}
