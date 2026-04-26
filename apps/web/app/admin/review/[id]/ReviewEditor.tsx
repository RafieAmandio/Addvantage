"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HASHTAGS, IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { approveItem, rejectItem, saveDraft } from "./actions";
import type { Database } from "@tradevantage/db";

type NewsRow = Database["public"]["Tables"]["news_items"]["Row"];

function Collapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 font-mono text-[9px] uppercase tracking-widest2 text-white/50 hover:bg-gray-2 hover:text-white/70"
      >
        <span>{label}</span>
        <span className="text-brand">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-3 bg-black p-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function ReviewEditor({ item }: { item: NewsRow }) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    headline: item.headline,
    rephrased: item.rephrased ?? "",
    analysis: item.analysis,
    impact: item.impact as (typeof IMPACT_LEVELS)[number],
    bias: item.bias as (typeof BIAS_LEVELS)[number],
    affects: item.affects.join(", "),
    tags: item.tags.join(", "),
    author: item.author,
  });
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const statusChip = {
    pending: "bg-brand/10 border-brand text-brand",
    approved: "bg-emerald-600/10 border-emerald-500 text-emerald-400",
    rejected: "bg-blood/10 border-blood text-red-500",
  }[item.status] ?? "bg-gray-2 border-gray-3 text-white/60";

  async function onSave() {
    const fd = new FormData();
    Object.entries(draft).forEach(([k, v]) => fd.set(k, String(v)));
    startTransition(async () => {
      const res = await saveDraft(item.id, fd);
      setSaveMsg(res.ok ? "saved" : `error: ${res.error}`);
    });
  }

  async function onApprove() {
    startTransition(async () => {
      await approveItem(item.id);
    });
  }
  async function onReject() {
    startTransition(async () => {
      await rejectItem(item.id);
    });
  }

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/review"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/50 hover:text-brand"
          >
            ← Queue
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            /
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            [{item.source_code}]
          </span>
          <span
            className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 ${statusChip}`}
          >
            {item.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={pending || item.status !== "pending"}
            className="border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-red-500 hover:bg-blood hover:text-black disabled:opacity-40"
          >
            ✕ Reject
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="border border-gray-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/80 hover:border-brand hover:text-brand disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={pending || item.status !== "pending"}
            className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black hover:bg-white disabled:opacity-40"
          >
            ✓ Approve & publish
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-4 border border-gray-3 bg-gray-2/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60">
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: original */}
        <div className="border border-gray-3 bg-gray-2/20 p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
            ORIGINAL · [{item.source_code}]
          </div>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer"
              className="block truncate border border-gray-3 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              ↗ {item.source_url}
            </a>
          )}
          <pre className="mt-4 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/80">
            {item.raw_text ?? "(no raw text stored)"}
          </pre>
        </div>

        {/* Right: editable rephrase */}
        <div className="border border-brand/40 bg-black p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            REPHRASED · EDITABLE
          </div>

          <Field label="Headline">
            <input
              value={draft.headline}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-display text-xl text-white focus:border-brand focus:outline-none"
            />
          </Field>

          <Field label="Rephrased body">
            <textarea
              rows={5}
              value={draft.rephrased}
              onChange={(e) => setDraft((d) => ({ ...d, rephrased: e.target.value }))}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white focus:border-brand focus:outline-none"
            />
          </Field>

          <Field label="Analysis — what it means for price">
            <textarea
              rows={4}
              value={draft.analysis}
              onChange={(e) => setDraft((d) => ({ ...d, analysis: e.target.value }))}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white focus:border-brand focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Impact">
              <select
                value={draft.impact}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, impact: e.target.value as typeof draft.impact }))
                }
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white focus:border-brand focus:outline-none"
              >
                {IMPACT_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bias">
              <select
                value={draft.bias}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, bias: e.target.value as typeof draft.bias }))
                }
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white focus:border-brand focus:outline-none"
              >
                {BIAS_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Affects (comma-separated tickers)">
            <input
              value={draft.affects}
              onChange={(e) => setDraft((d) => ({ ...d, affects: e.target.value }))}
              placeholder="SPX, DXY, US10Y"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white focus:border-brand focus:outline-none"
            />
          </Field>

          <Field label="Tags (comma-separated, closed taxonomy)">
            <input
              value={draft.tags}
              onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              placeholder="risk-management, mean-reversion"
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white focus:border-brand focus:outline-none"
            />
            <div className="mt-1 flex flex-wrap gap-1 font-mono text-[8px] uppercase tracking-widest2 text-white/40">
              {HASHTAGS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    const current = draft.tags.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
                    if (current.includes(h)) return;
                    setDraft((d) => ({ ...d, tags: [...current, h].join(", ") }));
                  }}
                  className="border border-gray-3 px-1.5 py-0.5 hover:border-brand hover:text-brand"
                >
                  +{h}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Byline">
            <input
              value={draft.author}
              onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white focus:border-brand focus:outline-none"
            />
          </Field>
        </div>
      </div>

      {/* AI Pipeline Audit Trail */}
      {(item.ai_system_prompt || item.ai_user_message || item.ai_raw_response) && (
        <div className="mt-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            AI PIPELINE · AUDIT TRAIL
          </div>
          <div className="space-y-px">
            {item.ai_system_prompt && (
              <Collapsible label="System prompt">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/70">
                  {item.ai_system_prompt}
                </pre>
              </Collapsible>
            )}
            {item.ai_user_message && (
              <Collapsible label="User message (sent to OpenAI)">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/70">
                  {item.ai_user_message}
                </pre>
              </Collapsible>
            )}
            {item.ai_raw_response && (
              <Collapsible label="Raw AI response (before parsing)">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/70">
                  {formatJson(item.ai_raw_response)}
                </pre>
              </Collapsible>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50">
        {label}
      </div>
      {children}
    </div>
  );
}
