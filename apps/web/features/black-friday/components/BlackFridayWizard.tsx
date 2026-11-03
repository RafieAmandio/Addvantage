"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/api/client";
import { ACK_ITEMS } from "@/features/early-access/content";
import { Tilt } from "@/features/marketing/components/iso/Inspect";
import { Roll } from "@/features/marketing/components/Roll";
import { Build } from "@/features/marketing/components/iso/Build";
import { CopyPrice } from "@/features/marketing/components/iso/CopyPrice";
import { Ticker } from "@/features/marketing/components/iso/Ticker";
import { BF_LOSS_BUCKETS } from "@tradevantage/shared/schema";
import { DinnerCard } from "@/features/black-friday/components/DinnerFigure";
import { saveBlackFridayDraft, submitBlackFridayApplication } from "@/features/black-friday/actions";
import {
  BCA_DESTINATION,
  BINGX,
  EXPERIENCE_OPTIONS,
  MARKET_OPTIONS,
  PLANS,
  POSITION_OPTIONS,
  PROMO_ACKS,
  STEPS,
  USDT_DESTINATION,
  NOW_PRICE,
  WAS_PRICE,
  type Destination,
} from "@/features/black-friday/content";

type Plan = "free" | "full";
type Method = "usdt" | "bca";
type ProofKind = "bingx" | "payment";
interface Proof {
  path: string;
  preview: string | null;
  busy: boolean;
  error: string | null;
}

const EMPTY_PROOF: Proof = { path: "", preview: null, busy: false, error: null };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UID_RE = /^\d{4,24}$/;

const input =
  "h-12 w-full rounded-[10px] border border-tv-stone bg-tv-white px-3.5 text-[16px] text-tv-ink outline-none transition-colors placeholder:text-tv-mute/70 hover:border-tv-graphite focus:border-tv-ink aria-[invalid=true]:border-tv-downpaper";
const label = "block text-[15px] font-medium text-tv-ink";
const hint = "mt-1.5 text-[13px] leading-[1.45] text-tv-mute";
const err = "mt-1.5 text-[13px] leading-[1.45] text-tv-downpaper";

function looksLikeFullName(v: string) {
  const t = v.trim();
  return t.length >= 5 && /\s/.test(t) && /^[\p{L}\s.'-]+$/u.test(t);
}

export function BlackFridayWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [email, setEmail] = useState("");
  const [emailLeft, setEmailLeft] = useState(false); // flag a bad email only once they leave the field
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [experience, setExperience] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [positionSize, setPositionSize] = useState("");
  const [lossBucket, setLossBucket] = useState("");
  const [bingxUid, setBingxUid] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  // Apply's four acknowledgements, then the promo's own (dinner only for Full).
  const [acks, setAcks] = useState<Record<string, boolean>>({ risk: false, ownResearch: false, noGuarantee: false, terms: false, review: false, scope: false, dinner: false });
  const [signedName, setSignedName] = useState("");
  const [proofs, setProofs] = useState<Record<ProofKind, Proof>>({ bingx: EMPTY_PROOF, payment: EMPTY_PROOF });

  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [uidError, setUidError] = useState<string | null>(null);

  const nameOk = looksLikeFullName(signedName);
  const lastStep = STEPS.length - 1;
  // With BCA unpriced, USDT is the only way to pay, so it is chosen for the applicant.
  const payMethod: Method | null = BCA_DESTINATION ? method : "usdt";

  const canContinue = [
    EMAIL_RE.test(email.trim()) && name.trim().length >= 2 && contact.trim().length >= 3,
    !!experience && markets.length > 0 && !!positionSize && !!lossBucket,
    UID_RE.test(bingxUid) && !!proofs.bingx.path && !proofs.bingx.busy,
    plan === "free" || (plan === "full" && !!payMethod && !!proofs.payment.path && !proofs.payment.busy),
    promoAcks(plan).every((a) => acks[a.key]) && ACK_ITEMS.every((a) => acks[a.key]) && nameOk,
  ][step];

  const go = (n: number) => {
    setDir(n < step ? "back" : "fwd");
    setStep(n);
    setStepError(null);
    window.scrollTo({ top: 0 });
  };

  async function upload(kind: ProofKind, file: File) {
    const prev = proofs[kind].preview;
    if (prev) URL.revokeObjectURL(prev);
    const preview = URL.createObjectURL(file);
    const put = (p: Partial<Proof>) => setProofs((s) => ({ ...s, [kind]: { ...s[kind], ...p } }));
    put({ preview, busy: true, error: null, path: "" });
    try {
      const fd = new FormData();
      fd.append("image", file);
      // Same private-bucket pipeline as apply (5 MB, PNG/JPG/WEBP).
      const res = await fetch(`${API_BASE}/black-friday/upload-proof`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: { imageUrl: string } };
      put({ path: json.data.imageUrl, busy: false });
    } catch {
      put({ busy: false, error: "That file didn't upload. Use a PNG, JPG or WEBP under 5 MB." });
    }
  }

  async function handleContinue() {
    if (!canContinue || pending) return;
    if (step === 0 || step === 2) {
      setPending(true);
      const res = await saveBlackFridayDraft({ email, name, contact, ...(step === 2 ? { bingxUid } : {}) });
      setPending(false);
      if (!res.ok) {
        if (res.error === "uid_taken") {
          setShake((n) => n + 1);
          return setUidError("That BingX UID is already on another application. Check the number, or contact us if it's yours.");
        }
        if (res.error === "reviewed") return setStepError("This email already has an application the desk has reviewed. We'll be in touch by email.");
        // A failed draft save never blocks the applicant; submit carries everything anyway.
      } else if (step === 0 && res.status === "submitted") {
        setNotice("You've already applied with this email. Finishing again updates your application.");
      }
    }
    go(step + 1);
  }

  async function handleSubmit() {
    if (!canContinue || pending) return;
    setPending(true);
    setStepError(null);
    const full = plan === "full";
    const res = await submitBlackFridayApplication({
      email,
      name,
      contact,
      answers: { experience, markets, positionSize },
      biggestLossBucket: lossBucket,
      bingxUid,
      bingxProofPath: proofs.bingx.path,
      plan,
      paymentMethod: full ? payMethod : undefined,
      paymentProofPath: full ? proofs.payment.path : undefined,
      signedName,
      // Stored like apply: one boolean per acknowledgement the applicant ticked.
      acknowledgements: Object.fromEntries([...ACK_ITEMS, ...promoAcks(plan)].map((a) => [a.key, acks[a.key]])),
      website,
    });
    setPending(false);
    if (res.ok) {
      setDone(true);
      return window.scrollTo({ top: 0 });
    }
    if (res.error === "uid_taken") {
      setShake((n) => n + 1);
      setUidError("That BingX UID is already on another application. Check the number, or contact us if it's yours.");
      return go(2);
    }
    setStepError(
      res.error === "reviewed"
        ? "This email already has an application the desk has reviewed. We'll be in touch by email."
        : "We couldn't send your application. Check your connection and try again.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-24 sm:px-6 md:px-10 md:pt-28">
      <div className="grid gap-y-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-x-20">
        {/* Left: the pitch and the stepper */}
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="tv-eyebrow flex items-center gap-2.5 text-tv-mute">
            Black Friday <span aria-hidden>/</span> with
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/partners/bingx-ink.svg" alt="BingX" width={83} height={24} className="h-[15px] w-auto" />
          </p>
          <h1 className={cn("mt-5 text-[clamp(2.4rem,4.4vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.035em]", (step > 0 || done) && "hidden md:block")}>
            Open a BingX account.
            <br />
            Get the desk.
          </h1>
          <p className={cn("mt-5 max-w-[30rem] text-[17px] leading-[1.55] text-tv-graphite", (step > 0 || done) && "hidden md:block")}>
            Sign up on BingX with our code, then pick a plan. Free opens the crypto tools and the news desk. Full access is every tool for a year:{" "}
            <Was>{WAS_PRICE}</Was>, now <span className="font-mono">{NOW_PRICE}</span>.
          </p>

          {/* The member card sits right under the pitch so it is on screen at 1280x800; it builds once, again when the application is in. */}
          <Build key={done ? "done" : "start"} immediate className="mt-7 hidden max-w-[280px] md:block">
            <div data-build="" data-dx="-60" data-dy="34" data-fade="" data-at={done ? "100" : "300"}>
              <Tilt>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/vip-card.svg" alt="The VIP+ member card, drawn on the desk" width={390} height={237} className="h-auto w-full" />
              </Tilt>
            </div>
          </Build>
          <ol className="mt-7 hidden border-t border-tv-ink md:block" aria-label="Application steps">
            {STEPS.map((s, i) => {
              const state = done || i < step ? "done" : i === step ? "now" : "next";
              return (
                <li
                  key={s.n}
                  aria-current={state === "now" ? "step" : undefined}
                  className={cn("flex items-center gap-4 border-b border-tv-stone py-2 text-[15px] transition-colors", state === "next" && "text-tv-mute", state === "now" && "font-semibold")}
                >
                  <span className="font-mono text-[12px] tabular-nums text-tv-mute">{s.n}</span>
                  <span className="flex-1">{s.label}</span>
                  <span
                    aria-hidden
                    className={cn("h-2.5 w-2.5 rounded-[3px] transition-colors", state === "next" ? "border border-tv-mute" : "bg-tv-ink")}
                  />
                </li>
              );
            })}
          </ol>

        </aside>

        {/* Right: the form */}
        <section className="relative min-w-0 border-t border-tv-ink pt-6">
          {/* The one Signal on a step screen: progress, as a hairline. */}
          {!done && <div aria-hidden className="bf-progress absolute inset-x-0 -top-px" style={{ ["--p" as string]: (step + 1) / STEPS.length }} />}
          {done ? (
            <Done plan={plan} uid={bingxUid} method={payMethod} />
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <p className="tv-eyebrow text-tv-mute">
                  Step <RollingNumber value={STEPS[step]!.n} /> / 0{STEPS.length}
                </p>
                <p className="tv-eyebrow text-tv-mute md:hidden">{STEPS[step]!.label}</p>
              </div>

              {notice && <p role="status" className="mt-4 border-y border-tv-stone py-2.5 text-[14px] text-tv-graphite">{notice}</p>}

              <div key={step} data-dir={dir} className="bf-step">
              {step === 0 && (
                <Step title="Who you are">
                  <Field id="bf-email" label="Email" hint="Your login and where we send the decision.">
                    <TextInput valid={EMAIL_RE.test(email.trim())} id="bf-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" onFocus={() => setEmailLeft(false)} onBlur={() => setEmailLeft(true)} aria-invalid={emailLeft && email.length > 0 && !EMAIL_RE.test(email.trim())} />
                  </Field>
                  <Field id="bf-name" label="Name">
                    <TextInput valid={name.trim().length >= 2} id="bf-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
                  </Field>
                  <Field id="bf-contact" label="Telegram or WhatsApp" hint="A handle like @yourname, or a number with country code.">
                    <TextInput valid={contact.trim().length >= 3} id="bf-contact" type="text" autoComplete="off" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="@handle or +62 812 0000 0000" />
                  </Field>
                </Step>
              )}

              {step === 1 && (
                <Step title="How you trade">
                  <Group label="Years trading">
                    <Options options={EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} />
                  </Group>
                  <Group label="Main markets" hint="Pick every one you trade.">
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MARKET_OPTIONS.map((o) => {
                        const on = markets.includes(o.value);
                        return (
                          <button
                            key={o.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setMarkets((m) => (on ? m.filter((x) => x !== o.value) : [...m, o.value]))}
                            className={cn("flex h-11 items-center gap-2.5 rounded-[8px] border px-3.5 text-[15px] transition-colors", on ? "border-tv-ink" : "border-tv-stone hover:border-tv-graphite")}
                          >
                            <Mark on={on} />
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </Group>
                  <Group label="Typical position size">
                    <Options options={POSITION_OPTIONS} value={positionSize} onChange={setPositionSize} />
                  </Group>
                  <Group label="What is your biggest single trading loss?" hint="One trade, in US dollars.">
                    <Options options={BF_LOSS_BUCKETS.map((b) => ({ value: b.key, label: b.label }))} value={lossBucket} onChange={setLossBucket} />
                  </Group>
                </Step>
              )}

              {step === 2 && (
                <Step title="Your BingX account">
                  <div className="border-y border-tv-stone py-5">
                    <p className="text-[15px] leading-[1.55] text-tv-graphite">
                      Create your BingX account with code{" "}
                      <CopyPrice text={BINGX.code} className="rounded-[8px] border border-tv-ink px-2 py-0.5 font-mono font-medium text-tv-ink">
                        {BINGX.code}
                      </CopyPrice>
                      . Already on BingX under another code? This offer needs an account opened with ours.
                    </p>
                    <a href={BINGX.url} target="_blank" rel="noopener noreferrer" className="tv-btn tv-btn-line mt-4 w-full sm:w-auto">
                      <Roll label="Create your BingX account" />
                      <span aria-hidden className="tv-arrow">↗</span>
                    </a>
                  </div>
                  <Field id="bf-uid" label="BingX UID" hint="Digits only. In the BingX app: profile, then the number under your name.">
                    <div key={shake} className={cn(shake > 0 && "lv-shake")}>
                    <TextInput
                      valid={UID_RE.test(bingxUid) && !uidError}
                      id="bf-uid"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={bingxUid}
                      onChange={(e) => {
                        setBingxUid(e.target.value.replace(/\D/g, ""));
                        setUidError(null);
                      }}
                      placeholder="123456789"
                      aria-invalid={!!uidError}
                      aria-describedby={uidError ? "bf-uid-error" : undefined}
                      className="font-mono tabular-nums tracking-[0.04em]"
                    />
                    </div>
                    {uidError && <p id="bf-uid-error" role="alert" className={err}>{uidError}</p>}
                  </Field>
                  <Upload
                    id="bf-bingx-proof"
                    label="Screenshot of your BingX account"
                    hint="It must show your UID and the referral code. PNG, JPG or WEBP, max 5 MB."
                    proof={proofs.bingx}
                    onSelect={(f) => upload("bingx", f)}
                  />
                </Step>
              )}

              {step === 3 && (
                <Step title="Pick a plan">
                  <div role="radiogroup" aria-label="Plan" className="grid gap-3 pt-1 sm:grid-cols-2">
                    {(["free", "full"] as const).map((k) => {
                      const p = PLANS[k];
                      const on = plan === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPlan(k)}
                          className={cn(
                            "bf-card relative flex flex-col rounded-[10px] border p-5 text-left",
                            on ? "border-tv-ink bg-tv-white" : "border-tv-stone hover:border-tv-graphite",
                          )}
                        >
                          <span className="flex items-center justify-between">
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">{p.n}</span>
                            {/* Full access carries the screen's one Signal when chosen. */}
                            <span aria-hidden className={cn("bf-mark h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors", on ? (k === "full" ? "border border-tv-ink bg-tv-signal" : "bg-tv-ink") : "border border-tv-mute")} data-on={on || undefined} />
                          </span>
                          <span className="mt-2 text-[20px] font-semibold tracking-[-0.01em]">{p.name}</span>
                          <span className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono tabular-nums leading-none">
                            {"was" in p && <Was>{p.was}</Was>}
                            <span className="text-[28px] font-medium">{p.price}</span>
                            {"was" in p && <span className="rounded-[3px] border border-tv-stone px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-tv-mute">Black Friday</span>}
                          </span>
                          <span className="mt-1.5 text-[13px] text-tv-mute">{p.term}</span>
                          <ul className="mt-4 space-y-1.5 border-t border-tv-stone pt-4 text-[14px] leading-[1.4]">
                            {p.lines.map((l) => (
                              <li key={l} className="flex gap-2.5">
                                <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-[2px] bg-tv-ink" />
                                {l}
                              </li>
                            ))}
                          </ul>
                          {"dinner" in p && <span className="mt-4 text-[13px] leading-[1.45] text-tv-graphite">{p.dinner}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[14px] text-tv-mute">The desk reviews every application before access is granted, on both plans.</p>

                  {plan === "full" && (
                    <div className="space-y-6">
                      <DinnerCard id="plan" signal={false} className="bf-drop" />
                      {BCA_DESTINATION && (
                        <Group label="Pay with">
                          <Options
                            options={[
                              { value: "usdt", label: USDT_DESTINATION.amountLabel },
                              { value: "bca", label: BCA_DESTINATION.amountLabel },
                            ]}
                            value={method ?? ""}
                            onChange={(v) => setMethod(v as Method)}
                          />
                        </Group>
                      )}
                      {payMethod && <PaymentDetails dest={payMethod === "bca" && BCA_DESTINATION ? BCA_DESTINATION : USDT_DESTINATION} />}
                      {payMethod && (
                        <Upload
                          id="bf-payment-proof"
                          label="Transfer receipt"
                          hint="A screenshot of the completed transfer. PNG, JPG or WEBP, max 5 MB."
                          proof={proofs.payment}
                          onSelect={(f) => upload("payment", f)}
                        />
                      )}
                    </div>
                  )}
                </Step>
              )}

              {step === 4 && (
                <Step title="Liability waiver">
                  <p className="text-[15px] leading-[1.55] text-tv-graphite">The same waiver every member signs, then the Black Friday terms. Tick every line, then sign with your full legal name.</p>
                  <div className="border-t border-tv-stone">
                    {[...ACK_ITEMS, ...promoAcks(plan)].map((a, i) => (
                      <label key={a.key} className={cn("flex cursor-pointer items-start gap-3.5 border-b border-tv-stone py-3.5", i === ACK_ITEMS.length && "border-t border-t-tv-ink")}>
                        <input
                          type="checkbox"
                          checked={acks[a.key]}
                          onChange={(e) => setAcks((s) => ({ ...s, [a.key]: e.target.checked }))}
                          className="mt-[3px] h-4 w-4 shrink-0 accent-tv-ink"
                        />
                        <span className="text-[15px] leading-[1.5]">{a.label}</span>
                      </label>
                    ))}
                  </div>
                  <Field id="bf-signature" label="Sign by typing your full legal name">
                    <TextInput
                      valid={nameOk}
                      id="bf-signature"
                      type="text"
                      autoComplete="name"
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                      placeholder="Your full legal name"
                      aria-invalid={signedName.length > 0 && !nameOk}
                      aria-describedby={signedName.length > 0 && !nameOk ? "bf-signature-error" : undefined}
                      className="font-serif text-[22px] italic"
                      line={false}
                    />
                    <span aria-hidden className="bf-sign mt-1 block" style={{ ["--p" as string]: Math.min(signedName.trim().length / 18, 1) }} />
                    {signedName.length > 0 && !nameOk && (
                      <p id="bf-signature-error" className={err}>
                        Type your full legal name, first and last.
                      </p>
                    )}
                  </Field>
                </Step>
              )}

              </div>

              {stepError && (
                <p role="alert" className="mt-6 text-[14px] text-tv-downpaper">
                  {stepError}
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

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-tv-stone pt-6">
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  className={cn("tv-link py-2 text-[15px] text-tv-graphite", step === 0 && "invisible")}
                >
                  <span aria-hidden>←</span> Back
                </button>
                <button
                  type="button"
                  onClick={step < lastStep ? handleContinue : handleSubmit}
                  disabled={!canContinue || pending}
                  className="tv-btn tv-btn-ink disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Roll label={pending ? (step < lastStep ? "Saving" : "Sending") : step < lastStep ? "Continue" : "Submit application"} />
                  <span aria-hidden className="tv-arrow">→</span>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/** Mono digits that roll to their value (the landing's Ticker), and roll again when it changes. */
function RollingNumber({ value }: { value: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(f);
  }, []);
  return (
    <span className="tv-figure tabular-nums">
      <span data-cue="" data-on={on || undefined}>
        <Ticker value={value} />
      </span>
    </span>
  );
}

/** A field with the focus hairline drawing under it and a tick once the value is valid. */
function TextInput({ valid, line = true, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { valid: boolean; line?: boolean }) {
  return (
    <div className="bf-field relative mt-2">
      <input {...rest} className={cn(input, "pr-10", className)} />
      {line && <span aria-hidden className="bf-line" />}
      <svg aria-hidden data-on={valid || undefined} viewBox="0 0 14 14" className="bf-tick pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2">
        <path d="M2 7.5l3.2 3L12 3.5" pathLength={1} fill="none" stroke="#111214" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 space-y-7">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ id, label: text, hint: h, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
      {h && <p className={hint}>{h}</p>}
    </div>
  );
}

function Group({ label: text, hint: h, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className={label}>{text}</legend>
      {h && <p className={hint}>{h}</p>}
      {children}
    </fieldset>
  );
}

/** Included / chosen: a filled Ink square. Not chosen: the hairline square. Same mark as the landing. */
function Mark({ on }: { on: boolean }) {
  return <span aria-hidden data-on={on || undefined} className={cn("bf-mark h-2.5 w-2.5 shrink-0 rounded-[3px]", on ? "bg-tv-ink" : "border border-tv-mute")} />;
}

function Options({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("flex h-11 items-center gap-2.5 rounded-[8px] border px-3.5 text-left text-[15px] transition-colors", on ? "border-tv-ink bg-tv-white" : "border-tv-stone hover:border-tv-graphite")}
          >
            <Mark on={on} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(v);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable; the value is selectable */
    }
  };
  return { copied, copy };
}

function PaymentDetails({ dest }: { dest: Destination }) {
  const { copied, copy } = useCopy();
  return (
    <div className="rounded-[10px] border border-tv-ink px-4">
      <div className="flex items-baseline justify-between border-b border-tv-stone py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">{dest.method}</span>
        <span className="font-mono text-[20px] font-medium tabular-nums">{dest.amountLabel}</span>
      </div>
      {dest.rows.map((row) =>
        row.copyable ? (
          <button
            key={row.label}
            type="button"
            onClick={() => copy(row.value)}
            className="flex min-h-[48px] w-full items-start justify-between gap-4 border-b border-tv-stone py-3 text-left last:border-b-0"
          >
            <span className="shrink-0 text-[14px] text-tv-mute">{row.label}</span>
            <span className="flex items-start gap-2.5">
              <span className="break-all text-right font-mono text-[14px]">{row.value}</span>
              <span className="mt-px shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-tv-mute">{copied === row.value ? "Copied" : "Copy"}</span>
            </span>
          </button>
        ) : (
          <div key={row.label} className="flex justify-between gap-4 border-b border-tv-stone py-3 last:border-b-0">
            <span className="text-[14px] text-tv-mute">{row.label}</span>
            <span className="text-right font-mono text-[14px]">{row.value}</span>
          </div>
        ),
      )}
      <p className="border-t border-tv-stone py-3 text-[13px] leading-[1.45] text-tv-mute">{dest.note}</p>
    </div>
  );
}

function Upload({ id, label: text, hint: h, proof, onSelect }: { id: string; label: string; hint: string; proof: Proof; onSelect: (f: File) => void }) {
  const [over, setOver] = useState(false);
  const state = proof.busy ? "Uploading" : proof.path ? "Attached. Drop or choose another file to replace it." : "Drop a screenshot here, or choose a file";
  return (
    <div>
      <p className={label}>{text}</p>
      <p className={hint}>{h}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onSelect(f);
        }}
        className={cn(
          "relative mt-3 flex items-center gap-4 overflow-hidden rounded-[10px] border p-3 transition-colors",
          over ? "border-tv-ink bg-tv-white" : proof.path ? "border-tv-ink" : "border-dashed border-tv-graphite/40",
        )}
      >
        {proof.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={proof.preview} src={proof.preview} alt="" className="bf-drop h-14 w-14 shrink-0 rounded-[6px] border border-tv-stone object-cover" />
        ) : (
          <span aria-hidden className="h-14 w-14 shrink-0 rounded-[6px] border border-dashed border-tv-stone" />
        )}
        <span className="min-w-0 flex-1 text-[14px] text-tv-graphite" aria-live="polite">
          {state}
        </span>
        <label htmlFor={id} className="tv-btn tv-btn-line tv-btn-sm shrink-0 cursor-pointer">
          {proof.path ? "Replace" : "Choose file"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
            e.target.value = "";
          }}
        />
        <span aria-hidden data-state={proof.busy ? "busy" : proof.path ? "done" : "idle"} className="bf-upload-bar absolute inset-x-0 bottom-0" />
      </div>
      {proof.error && (
        <p role="alert" className={err}>
          {proof.error}
        </p>
      )}
    </div>
  );
}

function Done({ plan, uid, method }: { plan: Plan | null; uid: string; method: Method | null }) {
  const full = plan === "full";
  const rows: [string, string][] = [
    ["Plan", full ? PLANS.full.name : PLANS.free.name],
    ["BingX UID", uid],
    ...(full ? ([["Payment", `${method === "bca" && BCA_DESTINATION ? BCA_DESTINATION.amountLabel : USDT_DESTINATION.amountLabel}, receipt attached`]] as [string, string][]) : []),
    ["Status", "Waiting for review"],
  ];
  return (
    <div role="status">
      <p className="tv-eyebrow flex items-center gap-2.5 text-tv-mute">
        <span aria-hidden className={cn("h-2.5 w-2.5 rounded-[3px]", full ? "bg-tv-ink" : "bg-tv-signal")} />
        Application received
      </p>
      <h2 className="mt-4 text-[clamp(2.4rem,4.4vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Submitted.</h2>
      <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.55] text-tv-graphite">
        Every application is reviewed by the desk before access is granted, on the free plan and on Full access. We&apos;ll email you.
      </p>
      {full && (
        <div className="mt-6 max-w-[34rem]">
          <p className="text-[17px] leading-[1.55]">You&apos;re in for a chance to be invited to the exclusive BingX dinner (10 seats).</p>
          <DinnerCard id="done" className="mt-4" />
        </div>
      )}
      <dl className="mt-8 border-t border-tv-ink">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-tv-stone py-3 text-[15px]">
            <dt className="text-tv-mute">{k}</dt>
            <dd className={cn("text-right", k === "BingX UID" && "font-mono tabular-nums")}>{v}</dd>
          </div>
        ))}
      </dl>
      {!full && <Build immediate className="mt-10 max-w-[320px] md:hidden">
        <div data-build="" data-dx="-40" data-dy="24" data-fade="" data-at="150">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vip-card.svg" alt="" width={390} height={237} className="h-auto w-full" />
        </div>
      </Build>}
      <a href="https://tradevantage.gg" className="tv-link mt-8 inline-block text-[15px] text-tv-graphite">
        <span aria-hidden>←</span> TradeVantage
      </a>
    </div>
  );
}

/** The promo terms for the chosen plan, in the shape of apply's ACK_ITEMS. */
function promoAcks(plan: Plan | null): { key: string; label: string }[] {
  return [
    { key: "review", label: PROMO_ACKS.review },
    { key: "scope", label: PROMO_ACKS.scope[plan === "full" ? "full" : "free"] },
    ...(plan === "full" ? [{ key: "dinner", label: PROMO_ACKS.dinner }] : []),
  ];
}

/** The normal price, struck: muted ink with a hairline through it, in mono. */
function Was({ children }: { children: React.ReactNode }) {
  return (
    <s className="font-mono text-tv-ink/40 decoration-tv-ink/40 decoration-1">
      <span className="sr-only">Normally </span>
      {children}
    </s>
  );
}
