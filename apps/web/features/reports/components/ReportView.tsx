import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { pdfEmbedUrl, pdfViewUrl, reportDate, type ClassReport } from "@/features/reports/types";

function NeighborLink({ report, direction }: { report: ClassReport | null; direction: "newer" | "older" }) {
  if (!report) return <div className="flex-1" />;
  return (
    <Link
      href={`/app/education/reports/${report.slug}`}
      className={cn(
        "group min-w-0 flex-1 rounded-2xl bg-panel px-5 py-4 transition-colors hover:bg-raised focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
        direction === "older" && "text-right",
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {direction === "newer" ? "← Newer" : "Older →"}
      </p>
      <p className="mt-1 truncate text-[15px] font-medium text-white">{report.title}</p>
    </Link>
  );
}

export function ReportView({
  report,
  newer,
  older,
}: {
  report: ClassReport;
  newer: ClassReport | null;
  older: ClassReport | null;
}) {
  const date = reportDate(report.publishedAt);
  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <Link
        href="/app/education/reports"
        className="inline-block text-[13px] font-medium text-white/55 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        ← Class reports
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[75vh] min-h-[480px] w-full overflow-hidden rounded-2xl bg-black">
          <iframe src={pdfEmbedUrl(report.driveId)} title={report.title} allow="autoplay" className="h-full w-full" />
        </div>

        <Panel as="div" className="order-first lg:order-none lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Class recap
            <span className="px-1.5 text-white/20">/</span>
            {report.author}
          </p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">{report.title}</h1>
          {date && <p className="mt-1 text-[14px] text-white/55">{date.full}</p>}
          {report.summary && <p className="mt-3 text-[14px] leading-[21px] text-white/55">{report.summary}</p>}
          <a
            href={pdfViewUrl(report.driveId)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-full bg-raised px-3 py-1.5 text-[13px] font-medium text-white/75 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Open full PDF ↗
          </a>
        </Panel>
      </div>

      <div className="flex gap-4">
        <NeighborLink report={newer} direction="newer" />
        <NeighborLink report={older} direction="older" />
      </div>
    </div>
  );
}
