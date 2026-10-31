"use client";

import Link from "next/link";
import { useState } from "react";
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
import { authInput, authLabel, authPrimary } from "@/features/auth/components/AuthShell";

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

const inputClass = authInput;
const labelClass = authLabel;
const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
const bodyText = "text-[14px] leading-[21px] text-white/55";

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
  const [leadPending, setLeadPending] = useState(false);
  const [returning, setReturning] = useState<"draft" | "submitted" | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const advanceStep = (next: number) => setStep(next);

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

  const spinner = (
    <span
      aria-hidden
      className="inline-block h-4 w-4 shrink-0 border-2 border-black/25 border-t-black"
      style={{ animation: "btnSpin 0.7s steps(8) infinite" }}
    />
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-5 text-white sm:px-6">
      <Link href="/" aria-label="TradeVantage home" className="inline-flex self-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-vantage.png" alt="TradeVantage" className="h-7 w-auto" />
      </Link>

      <div className="mx-auto grid w-full max-w-4xl flex-1 content-center gap-4 py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-6 lg:pt-8">
          <p className={eyebrow}>Apply</p>
          <h1 className="mt-2 text-[24px] font-semibold leading-[30px] text-white">
            This is an application, not a waitlist.
          </h1>
          <p className={cn(bodyText, "mt-2")}>
            Your details, the cashback offer, the waiver, then payment. Access is issued by hand, not automated.
          </p>
          <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] lg:flex-col lg:gap-2">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                aria-current={!done && i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2",
                  !done && i === step ? "font-medium text-white" : done || i < step ? "text-white/55" : "text-white/30",
                )}
              >
                <span className={cn("w-4 font-num text-[15px] font-semibold", !done && i === step && "text-brand", (done || i < step) && "text-up")}>
                  {done || i < step ? "✓" : i + 1}
                </span>
                {s.label}
              </li>
            ))}
          </ol>
        </aside>

        <div className="rounded-2xl bg-panel p-6 sm:p-8">
        {done ? (
          <ConfirmationPanel />
        ) : (
          <div className="w-full">
            {returning && (
              <p
                role="status"
                className={cn(
                  "mb-6 rounded-xl bg-raised px-4 py-3 text-[13px] leading-[19px]",
                  returning === "submitted" ? "text-brand" : "text-white/70",
                )}
              >
                {returning === "submitted"
                  ? "You've already applied with this email. Finishing again updates your submission."
                  : "Welcome back. We restored what you filled in before."}
              </p>
            )}
            {step === 0 && (
              <StepShell n={1} label="Identity" title="Request access">
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
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/40">
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
              <StepShell n={2} label="Cashback" title="The cashback program">
                <p className={bodyText}>
                  Opt into the 100% money-back guarantee, or take early access on its own. Either way, the next steps are the same.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  <div>
                    <p className={eyebrow}>Partner brokers</p>
                    <p className={cn(bodyText, "mt-2")}>{BROKER_COPY}</p>
                    <div className="mt-2 divide-y divide-white/[0.07]">
                      {PARTNER_BROKERS.map((b) => (
                        <a
                          key={b.name}
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 py-3"
                        >
                          <BrokerLogo name={b.name} logoUrl={b.logoUrl} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium text-white">{b.name}</span>
                            <span className="block text-[13px] text-white/55">{b.kind}</span>
                          </span>
                          <span className="shrink-0 rounded-full border border-white/[0.14] px-3 py-1.5 text-[13px] font-medium text-white transition-colors group-hover:bg-raised">
                            Register ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {form.wantsCashback === true && (
                  <div className="space-y-4 rounded-xl bg-raised p-5 text-[14px] leading-[21px] text-white/70">
                    <p className="text-[15px] font-semibold text-white">{CASHBACK.headline}</p>
                    <div>
                      <p className="mb-2 font-medium text-white">How to qualify</p>
                      <ol className="space-y-2">
                        {CASHBACK.qualify.map((q, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="w-4 shrink-0 font-num text-[15px] font-semibold text-brand">{i + 1}</span>
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
              <StepShell n={3} label="Waiver" title="Liability waiver">
                <p className={bodyText}>
                  Read every line. This is binding. Tick all four, then sign with your full legal name.
                </p>
                <div className="divide-y divide-white/[0.07]">
                  {ACK_ITEMS.map((a) => (
                    <label key={a.key} className="flex cursor-pointer items-start gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={form.acks[a.key]}
                        onChange={(e) => set("acks", { ...form.acks, [a.key]: e.target.checked })}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                      />
                      <span className={cn("text-[14px] leading-[21px]", form.acks[a.key] ? "text-white" : "text-white/70")}>
                        {a.label}
                      </span>
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
                      "mt-2 h-12 w-full rounded-xl bg-raised px-4 font-serif text-[20px] italic text-white outline-none ring-1 placeholder:text-white/25 focus-visible:ring-brand",
                      form.signedName.length > 0 && !nameOk ? "ring-down" : nameOk ? "ring-up" : "ring-white/[0.08]",
                    )}
                  />
                  {form.signedName.length > 0 && !nameOk && (
                    <p id="ea-signature-error" className="mt-2 text-[13px] text-down">
                      Type your full legal name, first and last.
                    </p>
                  )}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell n={4} label="Payment" title="Payment">
                <p className={bodyText}>
                  One upfront payment secures your place. USDT is the cheaper option. Transfer, then upload your receipt.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <p role="alert" className="mt-6 text-[13px] text-down">
                {submitError}
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
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => step > 0 && advanceStep(step - 1)}
                disabled={step === 0}
                className="h-11 rounded-full px-4 text-[14px] text-white/55 transition-colors hover:bg-raised hover:text-white disabled:invisible"
              >
                Back
              </button>
              {step < lastStep ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue || leadPending}
                  className={authPrimary}
                >
                  {leadPending ? (
                    <>
                      {spinner}
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
                  className={authPrimary}
                >
                  {submitting ? (
                    <>
                      {spinner}
                      Submitting
                    </>
                  ) : (
                    "Submit application"
                  )}
                </button>
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
        className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1.5"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised text-[15px] font-semibold text-white">
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
  n: number;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className={eyebrow}>
          Step {n} of {STEPS.length} · {label}
        </p>
        <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">{title}</h2>
      </div>
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
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left ring-1 transition-colors focus-visible:outline-none focus-visible:ring-brand",
        active ? "bg-brand/[0.08] ring-brand" : "bg-raised ring-white/[0.08] hover:ring-white/20",
      )}
    >
      <span className="text-[15px] font-semibold text-white">{title}</span>
      <span className="text-[13px] text-white/55">{sub}</span>
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
    <div className="rounded-xl bg-raised p-5">
      <div className="flex items-baseline justify-between">
        <span className={eyebrow}>{dest.method}</span>
        <span className="font-num text-[24px] font-semibold leading-none text-white">{dest.amountLabel}</span>
      </div>
      <div className="mt-3 divide-y divide-white/[0.07]">
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
                className="group flex min-h-[44px] w-full items-start justify-between gap-3 py-2.5 text-left"
              >
                <span className="mt-0.5 shrink-0 text-[13px] text-white/55">{row.label}</span>
                <span className="flex items-start gap-2">
                  <span className="break-all text-right text-[14px] text-white">{row.value}</span>
                  <span className={cn("mt-px shrink-0 text-[12px] font-medium transition-colors", copied === row.value ? "text-up" : "text-white/40 group-hover:text-white")}>
                    {copied === row.value ? "Copied" : "Copy"}
                  </span>
                </span>
              </button>
            );
          }
          return (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-[13px] text-white/55">{row.label}</span>
              <span className="break-all text-right text-[14px] text-white">{row.value}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] leading-[19px] text-white/55">{dest.note}</p>
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
          "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-raised px-4 py-8 text-center transition-colors focus-within:ring-1 focus-within:ring-brand",
          uploaded ? "border-up/60" : "border-white/[0.14] hover:border-white/30",
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
          <img src={preview} alt="Payment proof preview" className="max-h-40 rounded-lg object-contain" />
        ) : (
          <span className="text-[22px] text-white/30">↑</span>
        )}
        <span className={cn("text-[13px]", uploaded ? "text-up" : "text-white/55")}>
          {uploading
            ? "Uploading your receipt..."
            : uploaded
              ? "Receipt attached. Click to replace."
              : "Upload a screenshot of your transfer. PNG, JPG or WEBP, max 5 MB."}
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-down">
          {error}
        </p>
      )}
    </div>
  );
}

function ConfirmationPanel() {
  const rows: [string, string][] = [
    ["Bonus", `+${CONFIRMATION.bonusMonths} months free`],
    ["Subscription starts", CONFIRMATION.subscriptionStart],
    ["Free through", CONFIRMATION.freeThrough],
    ["Subscription until", CONFIRMATION.subscriptionThrough],
  ];
  return (
    <div className="w-full">
      <p className={cn(eyebrow, "!text-up")}>Application received</p>
      <h2 className="mt-2 text-[24px] font-semibold leading-[30px] text-white">You&apos;re in.</h2>
      <p className={cn(bodyText, "mt-2")}>Welcome aboard, operator. You&apos;re locked in as a founding member.</p>
      <dl className="mt-5 divide-y divide-white/[0.07]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-white/55">{k}</dt>
            <dd className="text-right font-medium text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <p className={cn(bodyText, "mt-5")}>
        We&apos;re verifying your payment and broker details now. On{" "}
        <span className="font-medium text-white">{CONFIRMATION.accessEmailDate}</span> we&apos;ll email your access, with a
        link to set your password. Nothing else needed until then.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-white/[0.14] px-6 text-[14px] font-medium text-white transition-colors hover:bg-raised"
      >
        Back to TradeVantage
      </Link>
    </div>
  );
}
