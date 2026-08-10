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
    <button
      type="submit"
      disabled={pending}
      className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      {pending ? "…" : label}
    </button>
  );
}

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

  const statusChip = plan
    ? {
        draft: "bg-gray-2 border-gray-3 text-white/60",
        published: "bg-brand/10 border-brand text-brand",
        closed: "bg-blood/10 border-blood text-blood-bright",
      }[plan.status]
    : "bg-gray-2 border-gray-3 text-white/60";

  return (
    <div className="stagger mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/plans"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/50 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Plans
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            /
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            {isNew ? "NEW" : plan.symbol}
          </span>
          {plan && (
            <span
              className={cn("border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2", statusChip)}
            >
              {plan.status}
              {plan.status === "closed" && plan.outcome
                ? ` · ${plan.outcome}`
                : ""}
            </span>
          )}
        </div>
      </div>

      {state.error && (
        <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          error: {state.error}
        </div>
      )}
      {state.ok && !isNew && (
        <div className="mb-4 border border-gray-3 bg-gray-2/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60">
          saved
        </div>
      )}

      <form action={formAction} className="border border-brand/40 bg-black p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Symbol">
            <input
              name="symbol"
              defaultValue={plan?.symbol ?? ""}
              required
              placeholder="SPX"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </Field>
          <Field label="Market Bias">
            <select
              value={bias}
              onChange={(e) => setBias(e.target.value as typeof bias)}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            >
              {BIASES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tier">
            <select
              name="tier"
              defaultValue={plan?.tier ?? "free"}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Thesis">
          <textarea
            name="thesis"
            rows={16}
            required
            defaultValue={plan?.thesis ?? ""}
            placeholder={
              "Market outlook — why this bias, what breaks it.\n\nLeave a blank line between sections; they render as separate paragraphs. Single line breaks and indentation are kept as typed."
            }
            className="mt-4 w-full resize-y border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            Blank line = new paragraph · line breaks preserved
          </span>
        </Field>

        <Field label="Tags (comma-separated)">
          <input
            name="tags"
            defaultValue={plan?.tags.join(", ") ?? ""}
            placeholder="risk-management, mean-reversion"
            className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
        </Field>

        {/* Hidden fields */}
        <input type="hidden" name="bias" value={bias} />
        <input type="hidden" name="direction" value={derivedDirection} />
        <input type="hidden" name="setups" value={serializedSetups} />
        <input type="hidden" name="risks" value={serializedRisks} />

        {/* Setups editor */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              Setups ({setups.length})
            </span>
            <button
              type="button"
              onClick={addSetup}
              className="font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
            >
              + Add setup
            </button>
          </div>
          <div className="space-y-4">
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
        </div>

        {/* Risks editor */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              Risks ({risks.length})
            </span>
            <button
              type="button"
              onClick={addRisk}
              className="font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
            >
              + Add risk
            </button>
          </div>
          {risks.length > 0 && (
            <div className="space-y-2 border border-gray-3 bg-gray-2/20 p-4">
              {risks.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-white/30">
                    {i + 1}.
                  </span>
                  <input
                    value={r}
                    onChange={(e) => updateRisk(i, e.target.value)}
                    placeholder="Risk factor"
                    className="flex-1 border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeRisk(i)}
                    className="font-mono text-[9px] text-white/30 transition-colors hover:text-blood-bright"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <SubmitButton label={isNew ? "Create draft" : "Save draft"} />
        </div>
      </form>

      {plan && (
        <PlanImageUpload key={plan.id} planId={plan.id} imageUrl={plan.imageUrl ?? null} />
      )}

      {plan && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-gray-3 bg-gray-2/20 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/50">
            Lifecycle
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plan.status === "draft" && (
              <form action={publishPlan.bind(null, plan.id)}>
                <button
                  type="submit"
                  className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  ✓ Publish
                </button>
              </form>
            )}
            {plan.status === "published" && (
              <form
                action={closePlan.bind(null, plan.id)}
                className="flex items-center gap-2"
              >
                <select
                  name="outcome"
                  defaultValue="win"
                  className="border border-gray-3 bg-gray-2 px-2 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
                >
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
                  className="w-32 border border-gray-3 bg-gray-2 px-2 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright transition-colors hover:bg-blood hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  ✕ Close
                </button>
              </form>
            )}
            <form action={deletePlan.bind(null, plan.id)}>
              <button
                type="submit"
                className="border border-gray-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-blood hover:text-blood-bright focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="mt-6 border border-gray-3 bg-gray-2/20 p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
        Chart Image
      </div>

      {error && (
        <div className="mb-3 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="mb-3">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={imageUrl}
              alt="Plan chart"
              className="max-h-64 w-full rounded border border-gray-3 object-contain"
            />
          </a>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="font-mono text-[10px] text-white/60 file:mr-3 file:border file:border-gray-3 file:bg-gray-2 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-widest2 file:text-white/60 file:transition-colors hover:file:border-brand hover:file:text-brand disabled:opacity-40"
        />
        {imageUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={uploading}
            className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-blood hover:text-blood-bright disabled:opacity-40"
          >
            {uploading ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
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
    <label className="mb-4 block">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}
