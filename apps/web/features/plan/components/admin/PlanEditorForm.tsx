"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  createPlan,
  updatePlan,
  publishPlan,
  closePlan,
  deletePlan,
  type PlanActionState,
} from "@/features/plan/actions";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { API_BASE, getAccessToken } from "@/lib/api/client";
import type { Plan } from "@/features/plan/types";
import {
  SetupEditorCard,
  emptySetup,
  type SetupEntry,
} from "./SetupEditorCard";

const INITIAL: PlanActionState = { ok: false };

const BIASES = ["bullish", "bearish", "neutral"] as const;
const TIERS = ["free", "vip"] as const;
const OUTCOMES = ["win", "loss", "breakeven", "stopped"] as const;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={PRIMARY_BTN}>
      {pending ? "Saving" : label}
    </button>
  );
}

const INPUT =
  "mt-2 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const TEXTAREA =
  "mt-2 w-full resize-y rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const PRIMARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
const SECONDARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/[0.14] px-5 text-[14px] font-medium text-white transition-colors hover:bg-raised disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
const SMALL_BTN =
  "rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised disabled:opacity-40";
const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

const STATUS_TEXT = {
  draft: "text-white/55",
  published: "text-brand",
  closed: "text-down",
} as const;

type RichCandidate = Record<string, unknown>;

function initSetups(plan: Plan | null): SetupEntry[] {
  if (!plan || plan.setups.length === 0) return [emptySetup(0)];

  const entries: SetupEntry[] = [];
  for (let i = 0; i < plan.setups.length; i++) {
    const raw = plan.setups[i] as RichCandidate;
    if (raw.label === "__risks__") continue;

    const isRich =
      typeof raw.instrument === "string" &&
      (raw.direction === "long" || raw.direction === "short");

    if (isRich) {
      entries.push({
        id:
          typeof raw.id === "string"
            ? raw.id
            : `S-${String(entries.length + 1).padStart(2, "0")}`,
        instrument: raw.instrument as string,
        direction: raw.direction as "long" | "short",
        bias:
          raw.bias === "bullish" || raw.bias === "bearish" || raw.bias === "neutral"
            ? (raw.bias as SetupEntry["bias"])
            : raw.direction === "long"
              ? "bullish"
              : "bearish",
        entry: typeof raw.entry === "string" ? raw.entry : "",
        stop: typeof raw.stop === "string" ? raw.stop : "",
        targets: Array.isArray(raw.targets)
          ? (raw.targets as string[]).length > 0
            ? (raw.targets as string[])
            : [""]
          : [""],
        invalidation:
          typeof raw.invalidation === "string" ? raw.invalidation : "",
        rationale: typeof raw.rationale === "string" ? raw.rationale : "",
        confidence:
          typeof raw.confidence === "number" &&
          raw.confidence >= 1 &&
          raw.confidence <= 5
            ? (raw.confidence as 1 | 2 | 3 | 4 | 5)
            : 3,
        tags: Array.isArray(raw.tags)
          ? (raw.tags as string[])
          : [],
        imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
      });
    } else {
      entries.push({
        id: `S-${String(entries.length + 1).padStart(2, "0")}`,
        instrument: typeof raw.label === "string" ? raw.label : "",
        direction: "long",
        bias: "bullish",
        entry: typeof raw.trigger === "string" ? raw.trigger : "",
        stop: "",
        targets: [""],
        invalidation:
          typeof raw.invalidation === "string" ? raw.invalidation : "",
        rationale: typeof raw.note === "string" ? raw.note : "",
        confidence: 3,
        tags: [],
        imageUrl: null,
      });
    }
  }

  return entries.length > 0 ? entries : [emptySetup(0)];
}

function initRisks(plan: Plan | null): string[] {
  if (!plan) return [];
  if (plan.risks && plan.risks.length > 0) return plan.risks;
  for (const s of plan.setups) {
    const raw = s as RichCandidate;
    if (raw.label === "__risks__" && Array.isArray(raw.items)) {
      return (raw.items as string[]).filter(
        (v): v is string => typeof v === "string",
      );
    }
  }
  return [];
}

export function PlanEditorForm({ plan }: { plan: Plan | null }) {
  const isNew = plan === null;

  const action = isNew ? createPlan : updatePlan.bind(null, plan.id);

  const [state, formAction] = useFormState(action, INITIAL);

  const [setups, setSetups] = useState<SetupEntry[]>(() => initSetups(plan));
  const [risks, setRisks] = useState<string[]>(() => initRisks(plan));
  const [bias, setBias] = useState<"bullish" | "bearish" | "neutral">(
    () => {
      if (plan?.bias === "bullish" || plan?.bias === "bearish" || plan?.bias === "neutral") return plan.bias;
      if (plan?.direction === "long") return "bullish";
      if (plan?.direction === "short") return "bearish";
      return "neutral";
    },
  );

  const derivedDirection = setups[0]?.direction ?? "long";

  const serializedSetups = useMemo(() => {
    const arr: Record<string, unknown>[] = setups.map((s) => ({
      label: s.instrument || s.id,
      id: s.id,
      instrument: s.instrument,
      direction: s.direction,
      bias: s.bias,
      entry: s.entry,
      stop: s.stop,
      targets: s.targets.filter(Boolean),
      invalidation: s.invalidation,
      rationale: s.rationale,
      confidence: s.confidence,
      tags: s.tags,
      imageUrl: s.imageUrl,
    }));
    return JSON.stringify(arr);
  }, [setups]);

  const serializedRisks = useMemo(
    () => JSON.stringify(risks.filter(Boolean)),
    [risks],
  );

  const updateSetup = (index: number, updated: SetupEntry) => {
    setSetups((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeSetup = (index: number) => {
    setSetups((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({
        ...s,
        id: `S-${String(i + 1).padStart(2, "0")}`,
      }));
    });
  };

  const addSetup = () => {
    setSetups((prev) => [...prev, emptySetup(prev.length)]);
  };

  const updateRisk = (index: number, val: string) => {
    setRisks((prev) => prev.map((r, i) => (i === index ? val : r)));
  };

  const removeRisk = (index: number) => {
    setRisks((prev) => prev.filter((_, i) => i !== index));
  };

  const addRisk = () => {
    setRisks((prev) => [...prev, ""]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        <Link href="/admin/plans" className="font-medium text-white/55 transition-colors hover:text-white">
          Plans
        </Link>
        <span className="text-white/25">/</span>
        <span className="font-medium text-white">{isNew ? "New plan" : plan.symbol}</span>
        {plan && (
          <span className={cn("font-medium capitalize", STATUS_TEXT[plan.status])}>
            {plan.status}
            {plan.status === "closed" && plan.outcome ? `, ${plan.outcome}` : ""}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form action={formAction} className="min-w-0 space-y-4">
          <Panel title="Plan" sub="Bias, audience and the written thesis.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Symbol">
                <input
                  name="symbol"
                  defaultValue={plan?.symbol ?? ""}
                  required
                  placeholder="SPX"
                  className={cn(INPUT, "uppercase")}
                />
              </Field>
              <Field label="Market bias">
                <select
                  value={bias}
                  onChange={(e) => setBias(e.target.value as typeof bias)}
                  className={INPUT}
                >
                  {BIASES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tier">
                <select name="tier" defaultValue={plan?.tier ?? "free"} className={INPUT}>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Thesis">
                <textarea
                  name="thesis"
                  rows={14}
                  required
                  defaultValue={plan?.thesis ?? ""}
                  placeholder={
                    "Market outlook. Why this bias, what breaks it.\n\nLeave a blank line between sections; they render as separate paragraphs. Single line breaks and indentation are kept as typed."
                  }
                  className={TEXTAREA}
                />
                <span className="mt-2 block text-[12px] text-white/40">
                  Blank line starts a new paragraph. Line breaks are kept.
                </span>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Tags (comma separated)">
                <input
                  name="tags"
                  defaultValue={plan?.tags.join(", ") ?? ""}
                  placeholder="risk-management, mean-reversion"
                  className={INPUT}
                />
              </Field>
            </div>
          </Panel>

          {/* Hidden fields */}
          <input type="hidden" name="bias" value={bias} />
          <input type="hidden" name="direction" value={derivedDirection} />
          <input type="hidden" name="setups" value={serializedSetups} />
          <input type="hidden" name="risks" value={serializedRisks} />

          <Panel
            title={`Setups (${setups.length})`}
            sub="The first setup sets the plan direction."
            action={
              <button type="button" onClick={addSetup} className={SMALL_BTN}>
                Add setup
              </button>
            }
          >
            <div className="space-y-3">
              {setups.map((s, i) => (
                <SetupEditorCard
                  key={s.id}
                  setup={s}
                  index={i}
                  onChange={(updated) => updateSetup(i, updated)}
                  onRemove={() => removeSetup(i)}
                  canRemove={setups.length > 1}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title={`Risks (${risks.length})`}
            action={
              <button type="button" onClick={addRisk} className={SMALL_BTN}>
                Add risk
              </button>
            }
          >
            {risks.length === 0 ? (
              <p className="text-[14px] text-white/40">No risks listed.</p>
            ) : (
              <div className="space-y-2">
                {risks.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 font-num text-[15px] font-semibold text-white/40">{i + 1}</span>
                    <input
                      value={r}
                      onChange={(e) => updateRisk(i, e.target.value)}
                      placeholder="Risk factor"
                      aria-label={`Risk ${i + 1}`}
                      className={cn(INPUT, "mt-0 flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => removeRisk(i)}
                      aria-label={`Remove risk ${i + 1}`}
                      className="h-8 w-8 shrink-0 rounded-full text-[15px] text-white/40 transition-colors hover:bg-raised hover:text-down"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {state.error && <p className="mr-auto text-[13px] text-down">Error: {state.error}</p>}
            {state.ok && !isNew && <p className="mr-auto text-[13px] text-up">Saved</p>}
            <SubmitButton label={isNew ? "Create draft" : "Save draft"} />
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {plan ? (
            <>
              <Panel title="Lifecycle" sub={LIFECYCLE_SUB[plan.status]}>
                <div className="mb-4 flex items-baseline justify-between">
                  <span className={EYEBROW}>Status</span>
                  <span className={cn("text-[15px] font-semibold capitalize", STATUS_TEXT[plan.status])}>
                    {plan.status}
                    {plan.status === "closed" && plan.outcome ? `, ${plan.outcome}` : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {plan.status === "draft" && (
                    <form action={publishPlan.bind(null, plan.id)}>
                      <button type="submit" className={cn(PRIMARY_BTN, "w-full")}>
                        Publish
                      </button>
                    </form>
                  )}
                  {plan.status === "published" && (
                    <form action={closePlan.bind(null, plan.id)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select name="outcome" defaultValue="win" aria-label="Outcome" className={cn(INPUT, "mt-0")}>
                          {OUTCOMES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <input
                          name="closePrice"
                          type="number"
                          step="any"
                          placeholder="Close price"
                          aria-label="Close price"
                          className={cn(INPUT, "mt-0 font-num text-[17px]")}
                        />
                      </div>
                      <button type="submit" className={cn(SECONDARY_BTN, "w-full")}>
                        Close plan
                      </button>
                    </form>
                  )}
                  <form action={deletePlan.bind(null, plan.id)}>
                    <button type="submit" className={cn(SECONDARY_BTN, "w-full text-down hover:text-down")}>
                      Delete
                    </button>
                  </form>
                </div>
              </Panel>
              <PlanImageUpload key={plan.id} planId={plan.id} imageUrl={plan.imageUrl ?? null} />
            </>
          ) : (
            <Panel title="New draft" sub="Save the draft first. Publishing and the chart image unlock after that.">
              <p className="text-[13px] text-white/40">Drafts stay hidden from members until published.</p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

const LIFECYCLE_SUB = {
  draft: "Hidden from members until published.",
  published: "Live for the selected tier. Close it with the outcome.",
  closed: "Archived with its outcome.",
} as const;

function PlanImageUpload({ planId, imageUrl: initial }: { planId: string; imageUrl: string | null }) {
  const [imageUrl, setImageUrl] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/plans/${planId}/image`, {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(body.message ?? `Upload failed (${res.status})`);
      }
      const json = await res.json();
      setImageUrl(json.data?.imageUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async () => {
    setUploading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/plans/${planId}/image`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Remove failed");
      setImageUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Panel title="Chart image" sub="Shown at the top of the plan.">
      {error && <p className="mb-3 text-[13px] text-down">{error}</p>}
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mb-3 block">
          <img src={imageUrl} alt="Plan chart" className="max-h-64 w-full rounded-xl bg-black object-contain" />
        </a>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="min-w-0 max-w-full text-[13px] text-white/55 file:mr-3 file:rounded-full file:border file:border-solid file:border-white/[0.14] file:bg-transparent file:px-3 file:py-1 file:text-[12px] file:font-medium file:text-white hover:file:bg-raised disabled:opacity-40"
        />
        {imageUrl && (
          <button type="button" onClick={remove} disabled={uploading} className={SMALL_BTN}>
            {uploading ? "Working" : "Remove"}
          </button>
        )}
      </div>
    </Panel>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
