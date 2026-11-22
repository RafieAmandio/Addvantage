"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import "@/features/marketing/landing.css";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { GRAIN_URL } from "@/features/marketing/components/iso/Iso";
import { PaperButton, paperInput, paperLabel } from "@/features/auth/components/PaperAuth";
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

const inputClass = cn(paperInput, "mt-2");
const labelClass = paperLabel;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikeFullName(v: string) {
  const t = v.trim();
  return t.length >= 5 && /\s/.test(t) && /^[\p{L}\s.'-]+$/u.test(t);
}

export function EarlyAccessWizard() {
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
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
        // Proof lives in a private bucket, so there's no previewable URL to
        // restore; the "receipt attached" state (proofImageUrl set) is enough.
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
    <main
      style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }}
      className={`tv-landing tv-grain relative isolate flex min-h-svh flex-col bg-tv-paper px-4 pb-12 pt-4 text-tv-ink sm:px-6 md:px-12 md:pt-6 ${tvFonts}`}
    >
      <header className="flex h-10 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="TradeVantage home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
        </Link>
        <Link href="/signup" className="tv-link py-1 text-[15px] text-tv-graphite hover:text-tv-ink">
          <span aria-hidden>←</span> Back
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[460px] py-12">
        {!done && <Progress step={step} />}
        {done ? (
          <ConfirmationPanel />
        ) : (
          <div key={stepKey} className="w-full">
            {returning && (
              <p
                role="status"
                className={cn(
                  "mb-6 rounded-[10px] border px-4 py-3 text-[14px] leading-[1.5]",
                  returning === "submitted"
                    ? "border-tv-ink bg-tv-white text-tv-ink"
                    : "border-tv-stone bg-tv-white text-tv-graphite",
                )}
              >
                {returning === "submitted"
                  ? "You've already applied with this email. Finishing again updates your submission."
                  : "Welcome back. We restored what you filled in before."}
              </p>
            )}
            {step === 0 && (
              <StepShell n="01" label="Identity" title="Request access">
                <div>
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
                <div>
                  <label htmlFor="ea-telegram" className={labelClass}>Telegram handle</label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-tv-mute">
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
                  className="text-[15px] leading-[1.55] text-tv-graphite"
                 
                >
                  Opt into the 100% money-back guarantee, or take early access on its own. Either way, the next steps are the same.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                {form.wantsCashback !== null && (
                  <div className="space-y-4">
                    <div>
                      <p className="tv-eyebrow text-tv-mute">
                        Partner brokers
                      </p>
                      <p className="mt-2 text-[15px] leading-[1.55] text-tv-graphite">{BROKER_COPY}</p>
                    </div>
                    <div className="divide-y divide-tv-stone overflow-hidden rounded-[10px] border border-tv-stone">
                      {PARTNER_BROKERS.map((b) => (
                        <a
                          key={b.name}
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 p-4 transition-colors duration-200 hover:bg-tv-paper"
                        >
                          <BrokerLogo name={b.name} logoUrl={b.logoUrl} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-semibold text-tv-ink">{b.name}</span>
                            <span className="block text-[13px] text-tv-graphite">{b.kind}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest2 text-tv-graphite transition-colors group-hover:text-tv-ink">
                            Register
                            <span className="transition-transform duration-200 group-hover:translate-x-0.5">↗</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {form.wantsCashback === true && (
                  <div
                    className="space-y-4 rounded-[10px] border border-tv-stone bg-tv-white p-5 text-[15px] leading-[1.6] text-tv-graphite"
                   
                  >
                    <p className="text-[17px] font-semibold text-tv-ink">{CASHBACK.headline}</p>
                    <div>
                      <p className="mb-2 font-semibold text-tv-ink">How to qualify</p>
                      <ol className="space-y-2">
                        {CASHBACK.qualify.map((q, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center bg-tv-signal font-mono text-[11px] font-bold text-tv-ink">
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
              </StepShell>
            )}

            {step === 2 && (
              <StepShell n="03" label="Waiver" title="Liability waiver">
                <p
                  className="text-[15px] leading-[1.55] text-tv-graphite"
                 
                >
                  Read every line. This is binding. Tick all four, then sign with your full legal name.
                </p>
                <div className="space-y-3">
                  {ACK_ITEMS.map((a) => (
                    <label
                      key={a.key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[10px] border p-4 transition-colors",
                        form.acks[a.key] ? "border-tv-ink bg-tv-white" : "border-tv-stone hover:border-tv-graphite",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.acks[a.key]}
                        onChange={(e) => set("acks", { ...form.acks, [a.key]: e.target.checked })}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#111214]"
                      />
                      <span className="text-[15px] leading-[1.5] text-tv-ink">{a.label}</span>
                    </label>
                  ))}
                </div>
                <div>
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
                      "mt-2 w-full rounded-[10px] border px-4 py-3 font-serif text-2xl italic outline-none transition-colors",
                      form.signedName.length > 0 && !nameOk
                        ? "border-tv-downpaper bg-tv-white text-tv-downpaper"
                        : nameOk
                          ? "border-tv-ink bg-tv-white text-tv-ink"
                          : "border-tv-stone bg-tv-white text-tv-ink placeholder:text-tv-mute focus-visible:border-tv-ink",
                    )}
                  />
                  {form.signedName.length > 0 && !nameOk && (
                    <p id="ea-signature-error" className="mt-2 text-[13px] text-tv-downpaper">
                      Type your full legal name, first and last.
                    </p>
                  )}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell n="04" label="Payment" title="Payment">
                <p
                  className="text-[15px] leading-[1.55] text-tv-graphite"
                 
                >
                  One upfront payment secures your place. USDT is the cheaper option. Transfer, then upload your receipt.
                </p>
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
                  <div className="space-y-5">
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
              <p role="alert" className="mt-6 animate-[shake_0.3s_ease-out] text-[14px] text-tv-downpaper">
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
            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => step > 0 && advanceStep(step - 1)}
                disabled={step === 0}
                className="tv-link min-h-[44px] py-3 text-[15px] text-tv-graphite hover:text-tv-ink disabled:invisible"
              >
                <span aria-hidden>←</span> Back
              </button>
              {step < lastStep ? (
                <PaperButton type="button" onClick={handleContinue} disabled={!canContinue} busy={leadPending} label="Continue" busyLabel="Saving" />
              ) : (
                <PaperButton type="button" onClick={handleSubmit} disabled={!canContinue} busy={submitting} label="Submit application" busyLabel="Submitting" />
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
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
        className="h-10 w-10 shrink-0 rounded-[10px] border border-tv-stone bg-white object-contain p-1.5"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-tv-stone bg-tv-paper text-[15px] font-semibold text-tv-ink">
      {name.charAt(0)}
    </span>
  );
}

function StepShell({ title, children }: { n: string; label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h2 className="lv-in text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">{title}</h2>
      {children}
    </div>
  );
}

/** Where you are: four hairline segments filling in Ink, the step named in mono. */
function Progress({ step }: { step: number }) {
  return (
    <div className="mb-10" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]?.label}`}>
      <p className="tv-eyebrow flex justify-between text-tv-mute">
        <span>
          {STEPS[step]?.n} / {String(STEPS.length).padStart(2, "0")}
        </span>
        <span className="text-tv-ink">{STEPS[step]?.label}</span>
      </p>
      <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s.n} className="h-[3px] overflow-hidden rounded-full bg-tv-stone">
            <span className={cn("block h-full origin-left bg-tv-ink transition-transform duration-500 ease-out", i <= step ? "scale-x-100" : "scale-x-0")} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Choice({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-1 rounded-[10px] border bg-tv-white p-4 text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.98]",
        active ? "border-tv-ink shadow-[0_0_0_1px_#111214]" : "border-tv-stone hover:border-tv-graphite",
      )}
    >
      <span className="flex items-center gap-2.5 text-[15px] font-semibold text-tv-ink">
        <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full border transition-colors", active ? "border-tv-ink bg-tv-signal" : "border-tv-stone")} />
        {title}
      </span>
      <span className="pl-5 text-[13px] text-tv-graphite">{sub}</span>
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
    <div className="rounded-[10px] border border-tv-stone bg-tv-white p-5">
      <div className="flex items-baseline justify-between">
        <span className="tv-eyebrow text-tv-mute">{dest.method}</span>
        <span className="font-mono text-lg font-medium text-tv-ink">{dest.amountLabel}</span>
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
                className="group -mx-2 flex min-h-[44px] w-full items-start justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-tv-paper"
              >
                <span className="mt-0.5 shrink-0 text-[13px] text-tv-graphite">{row.label}</span>
                <span className="flex items-start gap-2">
                  <span className="break-all text-right font-mono text-sm text-tv-ink">{row.value}</span>
                  <span className="mt-px shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-tv-mute transition-colors group-hover:text-tv-ink">
                    {copied === row.value ? "Copied" : "Copy"}
                  </span>
                </span>
              </button>
            );
          }
          return (
            <div key={row.label} className="flex items-center justify-between gap-4 px-0 py-2">
              <span className="text-[13px] text-tv-graphite">{row.label}</span>
              <span className="break-all text-right font-mono text-sm text-tv-ink">{row.value}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] leading-[1.5] text-tv-graphite">{dest.note}</p>
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
          "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-8 text-center transition-colors",
          uploaded ? "border-tv-ink bg-tv-white" : "border-tv-stone hover:border-tv-ink hover:bg-tv-paper",
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
          <img src={preview} alt="Payment proof preview" className="max-h-40 rounded border border-tv-stone object-contain" />
        ) : (
          <span className="text-2xl text-tv-mute">↑</span>
        )}
        <span className="text-[13px] text-tv-graphite">
          {uploading
            ? "Uploading your receipt..."
            : uploaded
              ? "Receipt attached. Click to replace."
              : "Upload a screenshot of your transfer. PNG, JPG or WEBP, max 5 MB."}
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-tv-downpaper">
          {error}
        </p>
      )}
    </div>
  );
}

function ConfirmationPanel() {
  return (
    <div className="w-full max-w-md text-center">
      <p className="tv-eyebrow flex items-center justify-center gap-2 text-tv-ink"><span aria-hidden className="h-2 w-2 rounded-full bg-tv-signal" />Application received</p>
      <h2 className="mt-5 text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-tv-ink">
        You&apos;re in.
      </h2>
      <p className="mx-auto mt-4 max-w-sm text-[15px] leading-[1.6] text-tv-graphite">
        Welcome aboard, operator. You&apos;re locked in as a founding member.
      </p>
      <div className="mt-8 space-y-2 rounded-[10px] border border-tv-stone bg-tv-white p-5 text-left text-[15px]">
        <div className="flex items-center justify-between">
          <span className="text-tv-graphite">Bonus</span>
          <span className="font-bold text-tv-ink">+{CONFIRMATION.bonusMonths} months free</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-tv-graphite">Subscription starts</span>
          <span className="font-bold text-tv-ink">{CONFIRMATION.subscriptionStart}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-tv-graphite">Free through</span>
          <span className="font-bold text-tv-ink">{CONFIRMATION.freeThrough}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-tv-graphite">Subscription until</span>
          <span className="font-bold text-tv-ink">{CONFIRMATION.subscriptionThrough}</span>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-sm text-[15px] leading-[1.6] text-tv-graphite">
        We&apos;re verifying your payment and broker details now. On{" "}
        <span className="font-bold text-tv-ink">{CONFIRMATION.accessEmailDate}</span> we&apos;ll email your access, with a
        link to set your password. Nothing else needed until then.
      </p>
      <Link href="/" className="tv-link mt-8 inline-block text-[15px] text-tv-graphite hover:text-tv-ink">
        &larr; Back to TradeVantage
      </Link>
    </div>
  );
}
