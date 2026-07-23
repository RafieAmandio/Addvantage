"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createReport,
  updateReport,
  deleteReport,
  type ReportActionState,
} from "@/features/reports/admin/actions";
import type { ClassReportAdmin } from "@/features/reports/admin/queries";
import { parseDriveId } from "@/features/reports/lib/drive";
import { thumbnailUrl } from "@/features/reports/types";
import { cn } from "@/lib/cn";

const INITIAL: ReportActionState = { ok: false };

const inputCls =
  "w-full border border-gray-3 bg-black px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand focus:outline-none";
const labelCls =
  "mb-1 block font-mono text-[10px] uppercase tracking-widest2 text-white/40";

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function ReportEditorForm({ report }: { report: ClassReportAdmin | null }) {
  const action = report ? updateReport.bind(null, report.id) : createReport;
  const [state, formAction] = useFormState(action, INITIAL);
  const [driveInput, setDriveInput] = useState(report?.driveId ?? "");
  const [slug, setSlug] = useState(report?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!report);

  const driveId = parseDriveId(driveInput);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={formAction} className="border border-brand/40 bg-black p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="r-title" className={labelCls}>
              Title
            </label>
            <input
              id="r-title"
              name="title"
              required
              maxLength={200}
              defaultValue={report?.title ?? ""}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputCls}
              placeholder="Live Class — CPI Reaction & Market Update"
            />
          </div>

          <div>
            <label htmlFor="r-slug" className={labelCls}>
              Slug
            </label>
            <input
              id="r-slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={cn(inputCls, "font-mono")}
              placeholder="live-class-2026-07-14"
            />
          </div>

          <div>
            <label htmlFor="r-date" className={labelCls}>
              Published date
            </label>
            <input
              id="r-date"
              name="publishedAt"
              type="date"
              defaultValue={toDateInput(report?.publishedAt)}
              className={cn(inputCls, "font-mono")}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="r-drive" className={labelCls}>
              Drive PDF link or ID
            </label>
            <input
              id="r-drive"
              name="drive"
              required
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              className={cn(inputCls, "font-mono")}
              placeholder="https://drive.google.com/file/d/…/view"
            />
          </div>

          <div>
            <label htmlFor="r-author" className={labelCls}>
              Author
            </label>
            <input
              id="r-author"
              name="author"
              maxLength={80}
              defaultValue={report?.author ?? "Anthony"}
              className={inputCls}
              placeholder="Anthony"
            />
          </div>

          <div>
            <label htmlFor="r-sort" className={labelCls}>
              Sort order
            </label>
            <input
              id="r-sort"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={report?.sortOrder ?? 0}
              className={cn(inputCls, "font-mono")}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="r-summary" className={labelCls}>
              Summary
            </label>
            <textarea
              id="r-summary"
              name="summary"
              rows={4}
              maxLength={2000}
              defaultValue={report?.summary ?? ""}
              className={inputCls}
              placeholder="One or two lines on what the report covers…"
            />
          </div>

          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 sm:col-span-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={report?.published ?? false}
              className="h-4 w-4 accent-[#FFD400]"
            />
            Published
          </label>
        </div>

        {state.error && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-moss">
            Saved
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton label={report ? "Save changes" : "Create report"} />
          <Link
            href="/admin/reports"
            className="border border-white/[0.1] px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div>
        <div className={labelCls}>PDF preview</div>
        <div className="aspect-[4/3] border border-white/[0.06] bg-black-2">
          {driveId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl(driveId)}
              alt="PDF thumbnail preview"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-widest2 text-white/20">
              {driveInput ? "Invalid Drive link" : "Paste a Drive link to preview"}
            </div>
          )}
        </div>
        {driveId && (
          <div className="mt-2 font-mono text-[10px] text-white/40">drive: {driveId}</div>
        )}

        {report && (
          <form
            action={deleteReport.bind(null, report.id)}
            className="mt-8 border-t border-gray-3 pt-4"
          >
            <button
              type="submit"
              className="border border-blood-bright/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright transition-colors hover:bg-blood-bright hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Delete report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
