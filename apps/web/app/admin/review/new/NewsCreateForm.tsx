"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  HASHTAGS,
  IMPACT_LEVELS,
  BIAS_LEVELS,
  SOURCE_CODES,
} from "@tradevantage/shared";
import { createNewsItem, type CreateFormState } from "./actions";

const initialState: CreateFormState = { ok: false };

export function NewsCreateForm() {
  const [state, formAction, pending] = useActionState(
    createNewsItem,
    initialState,
  );
  const [tags, setTags] = useState("");

  return (
    <div className="stagger mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/review"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/50 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Queue
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            /
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            NEW ITEM
          </span>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          Error: {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border border-gray-3 bg-gray-2/20 p-4 sm:p-6">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
              SOURCE & RAW INPUT
            </div>

            <Field label="Source">
              <select
                name="sourceCode"
                defaultValue="FRED"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              >
                {SOURCE_CODES.map((code) => (
                  <option key={code} value={code}>
                    [{code}]
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Source URL (optional)">
              <input
                name="sourceUrl"
                type="url"
                placeholder="https://..."
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>

            <Field label="Raw text (optional — for audit trail)">
              <textarea
                name="rawText"
                rows={8}
                placeholder="Paste the original text here..."
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>
          </div>

          <div className="border border-brand/40 bg-black p-4 sm:p-6">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-brand">
              REPHRASED OUTPUT
            </div>

            <Field label="Headline">
              <input
                name="headline"
                required
                maxLength={240}
                placeholder="Terse, tactical headline — no clickbait"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-display text-xl text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>

            <Field label="Rephrased body">
              <textarea
                name="rephrased"
                rows={5}
                required
                placeholder="Full rephrase of the source material..."
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>

            <Field label="Analysis — what it means for price">
              <textarea
                name="analysis"
                rows={4}
                required
                placeholder="One paragraph: what this means for price action..."
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 text-sm leading-relaxed text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Impact">
                <select
                  name="impact"
                  defaultValue="medium"
                  className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
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
                  name="bias"
                  defaultValue="neutral"
                  className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
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
                name="affects"
                placeholder="SPX, DXY, US10Y"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>

            <Field label="Tags (comma-separated, closed taxonomy)">
              <input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="risk-management, mean-reversion"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
              <div className="mt-1 flex flex-wrap gap-1 font-mono text-[8px] uppercase tracking-widest2 text-white/40">
                {HASHTAGS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const current = tags
                        .split(/[,\s]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (current.includes(h)) return;
                      setTags([...current, h].join(", "));
                    }}
                    className="border border-gray-3 px-1.5 py-0.5 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    +{h}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Byline">
              <input
                name="author"
                required
                defaultValue="DESK"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href="/admin/review"
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="border border-brand bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            {pending ? "Creating…" : "Create → Review queue"}
          </button>
        </div>
      </form>
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
