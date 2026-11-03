"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  HASHTAGS,
  IMPACT_LEVELS,
  BIAS_LEVELS,
  SOURCE_CODES,
} from "@tradevantage/shared";
import { createNewsItem, type CreateFormState } from "./actions";
import { Panel } from "@/components/ui/Panel";

const inputClass =
  "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";
const textareaClass =
  "w-full rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";

const initialState: CreateFormState = { ok: false };

export function NewsCreateForm() {
  const [state, formAction] = useFormState(
    createNewsItem,
    initialState,
  );
  const [tags, setTags] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[13px]">
        <Link
          href="/admin/review"
          className="rounded-full px-2.5 py-1 font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Queue
        </Link>
        <span className="text-white/20">/</span>
        <span className="font-medium text-white">New item</span>
      </div>

      {state.error && (
        <p role="alert" className="text-[13px] text-down">
          Error: {state.error}
        </p>
      )}

      <form action={formAction}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Source and raw input" sub="Where it came from, kept for the audit trail" className="lg:self-start">
            <div className="space-y-4">

            <Field label="Source">
              <select
                name="sourceCode"
                defaultValue="FRED"
                className={inputClass}
              >
                {SOURCE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Source URL (optional)">
              <input
                name="sourceUrl"
                type="url"
                placeholder="https://..."
                className={inputClass}
              />
            </Field>

            <Field label="Raw text (optional, for the audit trail)">
              <textarea
                name="rawText"
                rows={8}
                placeholder="Paste the original text here..."
                className={textareaClass}
              />
            </Field>
            </div>
          </Panel>

          <Panel title="Rephrased output" sub="What subscribers will read once approved">
            <div className="space-y-4">

            <Field label="Headline">
              <input
                name="headline"
                required
                maxLength={240}
                placeholder="Terse, tactical headline, no clickbait"
                className={`${inputClass} h-12 text-[17px] font-medium`}
              />
            </Field>

            <Field label="Rephrased body">
              <textarea
                name="rephrased"
                rows={5}
                required
                placeholder="Full rephrase of the source material..."
                className={textareaClass}
              />
            </Field>

            <Field label="Analysis, what it means for price">
              <textarea
                name="analysis"
                rows={4}
                required
                placeholder="One paragraph: what this means for price action..."
                className={textareaClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Impact">
                <select
                  name="impact"
                  defaultValue="medium"
                  className={inputClass}
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
                  className={inputClass}
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
                className={inputClass}
              />
            </Field>

            <Field label="Tags (comma-separated, closed taxonomy)">
              <input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="risk-management, mean-reversion"
                className={inputClass}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
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
                    className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
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
                className={inputClass}
              />
            </Field>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Link
            href="/admin/review"
            className="inline-flex h-11 items-center rounded-full border border-white/[0.14] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Cancel
          </Link>
          <SubmitButton />
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
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
    >
      {pending ? "Creating" : "Create and send to queue"}
    </button>
  );
}
