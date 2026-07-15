import Link from "next/link";
import {
  formatReportDate,
  pdfEmbedUrl,
  reportLabel,
  type ClassReport,
} from "@/features/reports/types";

function NeighborLink({
  report,
  index,
  direction,
}: {
  report: ClassReport | null;
  index: number;
  direction: "prev" | "next";
}) {
  if (!report) return <div className="flex-1" />;
  return (
    <Link
      href={`/app/education/reports/${report.slug}`}
      className={`group flex-1 border border-gray-3 bg-black px-4 py-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none ${
        direction === "next" ? "text-right" : ""
      }`}
    >
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        {direction === "prev" ? "← Previous" : "Next →"}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        {reportLabel(index)}
      </div>
      <div className="mt-0.5 truncate font-display text-base text-white group-hover:text-brand">
        {report.title}
      </div>
    </Link>
  );
}

export function ReportView({
  report,
  index,
  prev,
  next,
}: {
  report: ClassReport;
  index: number;
  prev: ClassReport | null;
  next: ClassReport | null;
}) {
  const date = formatReportDate(report.publishedAt);

  return (
    <div className="stagger mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/app/education/reports"
        className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        ← Class Reports
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {reportLabel(index)}
        </span>
        {date && (
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            {date}
          </span>
        )}
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {report.author}
        </span>
      </div>

      <h1 className="mt-2 font-display text-3xl leading-tight text-white sm:text-4xl">
        {report.title}
      </h1>
      {report.summary && (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/60">
          {report.summary}
        </p>
      )}

      <div className="mt-6 h-[85vh] w-full border border-white/[0.06] bg-black">
        <iframe
          src={pdfEmbedUrl(report.driveId)}
          title={report.title}
          allow="autoplay"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <a
        href={`https://drive.google.com/file/d/${report.driveId}/view`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        Open full PDF ↗
      </a>

      <div className="mt-10 flex gap-3">
        <NeighborLink report={prev} index={index - 1} direction="prev" />
        <NeighborLink report={next} index={index + 1} direction="next" />
      </div>
    </div>
  );
}
