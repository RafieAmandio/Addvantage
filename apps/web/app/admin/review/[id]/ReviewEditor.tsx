"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HASHTAGS, IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { approveItem, rejectItem, saveDraft } from "./actions";
import type { NewsRow } from "@/features/news/queries/news";

function Collapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-2.5 text-left text-[14px] font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
      >
        <span>{label}</span>
        <span className="text-[13px] text-white/40">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="mb-2 max-h-[480px] overflow-auto rounded-xl bg-raised p-4">{children}</div>}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";
const textareaClass =
  "w-full rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";
const preClass = "whitespace-pre-wrap break-words font-mono text-[12px] leading-[18px] text-white/70";

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

  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 3000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  const statusColor =
    item.status === "approved" ? "text-up" : item.status === "rejected" ? "text-down" : "text-white/55";

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

  const canDecide = item.status === "pending";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[13px]">
          <Link
            href="/admin/review"
            className="rounded-full px-2.5 py-1 font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Queue
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{item.sourceCode}</span>
          <span className={cn("font-medium capitalize", statusColor)}>{item.status}</span>
          {saveMsg && (
            <span role="status" className={cn("ml-1", saveMsg === "saved" ? "text-up" : "text-down")}>
              {saveMsg === "saved" ? "Saved" : saveMsg}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={pending || !canDecide}
            className="inline-flex h-10 items-center rounded-full border border-down/40 px-4 text-[13px] font-semibold text-down transition-colors hover:bg-down/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-raised disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={pending || !canDecide}
            className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            Approve and publish
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Edit item" sub="What subscribers will read once approved">
            <div className="space-y-4">
              <Field label="Headline">
                <input
                  value={draft.headline}
                  onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
                  className={cn(inputClass, "h-12 text-[17px] font-medium")}
                />
              </Field>

              <Field label="Rephrased body">
                <textarea
                  rows={5}
                  value={draft.rephrased}
                  onChange={(e) => setDraft((d) => ({ ...d, rephrased: e.target.value }))}
                  className={textareaClass}
                />
              </Field>

              <Field label="Analysis, what it means for price">
                <textarea
                  rows={4}
                  value={draft.analysis}
                  onChange={(e) => setDraft((d) => ({ ...d, analysis: e.target.value }))}
                  className={textareaClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Impact">
                  <select
                    value={draft.impact}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, impact: e.target.value as typeof draft.impact }))
                    }
                    className={cn(inputClass, "capitalize")}
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
                    className={cn(inputClass, "capitalize")}
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
                  className={inputClass}
                />
              </Field>

              <div>
                <Field label="Tags (comma-separated, closed taxonomy)">
                  <input
                    value={draft.tags}
                    onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                    placeholder="risk-management, mean-reversion"
                    className={inputClass}
                  />
                </Field>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {HASHTAGS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        const current = draft.tags.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
                        if (current.includes(h)) return;
                        setDraft((d) => ({ ...d, tags: [...current, h].join(", ") }));
                      }}
                      className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      +{h}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Byline">
                <input
                  value={draft.author}
                  onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
                  className={inputClass}
                />
              </Field>
            </div>
          </Panel>

          {(item.aiSystemPrompt || item.aiUserMessage || item.aiRawResponse) && (
            <Panel title="AI pipeline" sub="Audit trail of what the model saw and returned">
              <div className="divide-y divide-white/[0.07]">
                {item.aiSystemPrompt && (
                  <Collapsible label="System prompt">
                    <pre className={preClass}>{item.aiSystemPrompt}</pre>
                  </Collapsible>
                )}
                {item.aiUserMessage && (
                  <Collapsible label="User message (sent to OpenAI)">
                    <pre className={preClass}>{item.aiUserMessage}</pre>
                  </Collapsible>
                )}
                {item.aiRawResponse && (
                  <Collapsible label="Raw AI response (before parsing)">
                    <pre className={preClass}>{formatJson(item.aiRawResponse)}</pre>
                  </Collapsible>
                )}
              </div>
            </Panel>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <Panel
            title="Original"
            sub={item.sourceCode}
            action={
              item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  Open source ↗
                </a>
              ) : undefined
            }
          >
            {item.sourceUrl && (
              <p className="mb-3 truncate text-[12px] text-white/30">{item.sourceUrl}</p>
            )}
            <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words text-[14px] leading-[21px] text-white/70">
              {item.rawText ?? <span className="text-white/30">No raw text stored.</span>}
            </div>
          </Panel>
        </aside>
      </div>
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
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
