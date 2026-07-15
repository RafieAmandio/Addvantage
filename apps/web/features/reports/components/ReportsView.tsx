"use client";

import Link from "next/link";
import { DataLabel } from "@/components/ui/Marker";
import { EducationTabs } from "@/features/videos/components/EducationTabs";
import {
  formatReportDate,
  reportLabel,
  thumbnailUrl,
  type ClassReport,
} from "@/features/reports/types";

export function ReportsHeader() {
  return (
    <div className="border-b border-gray-3 bg-gray-2/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DataLabel>Education</DataLabel>
        <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
          Class <span className="italic text-brand">Reports</span>
        </h1>
        <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
          Written recaps of live classes and market sessions. Read the desk&apos;s
          reasoning in full — restricted to operators.
        </p>
        <EducationTabs current="reports" />
      </div>
    </div>
  );
}

function ReportRow({ report, index }: { report: ClassReport; index: number }) {
  const date = formatReportDate(report.publishedAt);
  return (
    <Link
      href={`/app/education/reports/${report.slug}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-5 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:grid-cols-[110px_1fr_auto_136px] sm:gap-6 sm:px-6"
    >
      <div className="hidden sm:block">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {reportLabel(index)}
        </div>
        {date && (
          <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            {date}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand sm:hidden">
          {reportLabel(index)}
          {date && <span className="ml-2 text-white/40">{date}</span>}
        </div>
        <h3 className="mt-1 truncate font-display text-xl leading-tight text-white transition-colors group-hover:text-brand sm:mt-0 sm:text-2xl">
          {report.title}
        </h3>
        {report.summary && (
          <p className="mt-1 hidden max-w-xl truncate text-sm text-white/50 md:block">
            {report.summary}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-widest2">
        <span className="border border-gray-3 px-1.5 py-0.5 text-white/60">PDF</span>
      </div>

      <div className="relative hidden aspect-[4/3] overflow-hidden border border-white/[0.06] bg-black-2 sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(report.driveId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-top saturate-50 transition-[filter] duration-200 group-hover:saturate-100"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        >
          <span className="bg-brand px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-black">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ReportsView({ reports }: { reports: ClassReport[] }) {
  return (
    <div className="stagger">
      <ReportsHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {reports.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 border border-gray-3 bg-black">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              No reports on file
            </div>
            <p className="text-sm text-white/30">
              Class recaps are published here after each session.
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-3">
            {reports.map((r, i) => (
              <ReportRow key={r.slug} report={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
