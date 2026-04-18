"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createPlan,
  updatePlan,
  publishPlan,
  closePlan,
  deletePlan,
  type PlanActionState,
} from "@/features/plan/actions";
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
      className="border border-lime bg-lime px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-ink hover:bg-paper disabled:opacity-40"
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
        draft: "bg-ink-2 border-ink-3 text-paper/60",
        published: "bg-lime/10 border-lime text-lime",
        closed: "bg-blood/10 border-blood text-blood",
      }[plan.status]
    : "bg-ink-2 border-ink-3 text-paper/60";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/plans"
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50 hover:text-lime"
          >
            ← Plans
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/30">
            /
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
            {isNew ? "NEW" : plan.symbol}
          </span>
          {plan && (
            <span
              className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 ${statusChip}`}
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
        <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood">
          error: {state.error}
        </div>
      )}
      {state.ok && !isNew && (
        <div className="mb-4 border border-ink-3 bg-ink-2/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
          saved
        </div>
      )}

      <form action={formAction} className="border border-lime/40 bg-ink p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Symbol">
            <input
              name="symbol"
              defaultValue={plan?.symbol ?? ""}
              required
              placeholder="SPX"
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper focus:border-lime focus:outline-none"
            />
          </Field>
          <Field label="Direction">
            <select
              name="direction"
              defaultValue={plan?.direction ?? "long"}
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper focus:border-lime focus:outline-none"
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
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper focus:border-lime focus:outline-none"
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
            className="mt-4 w-full border border-ink-3 bg-ink-2 px-3 py-2 text-sm leading-relaxed text-paper focus:border-lime focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label="Entry">
            <input
              name="entry"
              defaultValue={num(plan?.entry ?? null)}
              type="number"
              step="any"
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs text-paper focus:border-lime focus:outline-none"
            />
          </Field>
          <Field label="Stop">
            <input
              name="stop"
              defaultValue={num(plan?.stop ?? null)}
              type="number"
              step="any"
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs text-paper focus:border-lime focus:outline-none"
            />
          </Field>
          <Field label="Target">
            <input
              name="target"
              defaultValue={num(plan?.target ?? null)}
              type="number"
              step="any"
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs text-paper focus:border-lime focus:outline-none"
            />
          </Field>
          <Field label="R multiple">
            <input
              name="r_multiple"
              defaultValue={num(plan?.r_multiple ?? null)}
              type="number"
              step="any"
              className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs text-paper focus:border-lime focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Tags (comma-separated)">
          <input
            name="tags"
            defaultValue={plan?.tags.join(", ") ?? ""}
            placeholder="risk-management, mean-reversion"
            className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-paper focus:border-lime focus:outline-none"
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
            className="w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-xs leading-relaxed text-paper focus:border-lime focus:outline-none"
          />
        </Field>

        <div className="mt-6 flex items-center justify-end gap-2">
          <SubmitButton label={isNew ? "Create draft" : "Save draft"} />
        </div>
      </form>

      {plan && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-ink-3 bg-ink-2/20 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
            Lifecycle
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plan.status === "draft" && (
              <form action={publishPlan.bind(null, plan.id)}>
                <button
                  type="submit"
                  className="border border-lime bg-lime px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-ink hover:bg-paper"
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
                  className="border border-ink-3 bg-ink-2 px-2 py-2 font-mono text-xs uppercase tracking-widest2 text-paper focus:border-lime focus:outline-none"
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <input
                  name="close_price"
                  type="number"
                  step="any"
                  placeholder="Close price"
                  aria-label="Close price"
                  className="w-32 border border-ink-3 bg-ink-2 px-2 py-2 font-mono text-xs text-paper focus:border-lime focus:outline-none"
                />
                <button
                  type="submit"
                  className="border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood hover:bg-blood hover:text-ink"
                >
                  ✕ Close
                </button>
              </form>
            )}
            <form action={deletePlan.bind(null, plan.id)}>
              <button
                type="submit"
                className="border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-blood hover:text-blood"
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
        {label}
      </div>
      {children}
    </div>
  );
}
