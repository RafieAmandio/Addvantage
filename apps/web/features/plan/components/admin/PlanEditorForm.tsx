"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState } from "react";
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

const INITIAL: PlanActionState = { ok: false };

const DIRECTIONS = ["long", "short"] as const;
const TIERS = ["free", "vip"] as const;
const OUTCOMES = ["win", "loss", "breakeven", "stopped"] as const;

function num(v: number | null): string {
  return v === null ? "" : String(v);
}

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

export function PlanEditorForm({ plan }: { plan: Plan | null }) {
  const isNew = plan === null;

  const action = isNew ? createPlan : updatePlan.bind(null, plan.id);

  const [state, formAction] = useFormState(action, INITIAL);

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
          <Field label="Direction">
            <select
              name="direction"
              defaultValue={plan?.direction ?? "long"}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
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
            rows={4}
            required
            defaultValue={plan?.thesis ?? ""}
            placeholder="Why this trade, what breaks it"
            className="mt-4 w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label="Entry">
            <input
              name="entry"
              defaultValue={num(plan?.entry ?? null)}
              type="number"
              step="any"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </Field>
          <Field label="Stop">
            <input
              name="stop"
              defaultValue={num(plan?.stop ?? null)}
              type="number"
              step="any"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </Field>
          <Field label="Target">
            <input
              name="target"
              defaultValue={num(plan?.target ?? null)}
              type="number"
              step="any"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </Field>
          <Field label="R multiple">
            <input
              name="rMultiple"
              defaultValue={num(plan?.rMultiple ?? null)}
              type="number"
              step="any"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </Field>
        </div>

        <Field label="Tags (comma-separated)">
          <input
            name="tags"
            defaultValue={plan?.tags.join(", ") ?? ""}
            placeholder="risk-management, mean-reversion"
            className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
        </Field>

        <Field label="Setups (JSON array — [{label, trigger?, invalidation?, note?}])">
          <textarea
            name="setups"
            rows={6}
            defaultValue={
              plan && plan.setups.length > 0
                ? JSON.stringify(plan.setups, null, 2)
                : "[]"
            }
            className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
        </Field>

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
