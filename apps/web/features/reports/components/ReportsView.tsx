import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EducationTabs } from "@/features/videos/components/EducationTabs";
import { reportDate, type ClassReport } from "@/features/reports/types";

function ReportRow({ report }: { report: ClassReport }) {
  const date = reportDate(report.publishedAt);
  return (
    <Link
      href={`/app/education/reports/${report.slug}`}
      className="group flex items-center gap-4 py-4 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      <div className="w-16 shrink-0 text-center sm:w-20">
        <p className="font-num text-[28px] font-semibold leading-8 text-white/75 transition-colors group-hover:text-white">
          {date?.day ?? "--"}
        </p>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{date?.month ?? ""}</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          Class recap
          <span className="px-1.5 text-white/20">/</span>
          {report.author}
        </p>
        <h3 className="mt-1 truncate text-[17px] font-medium leading-6 text-white">{report.title}</h3>
        {report.summary && (
          <p className="mt-1 line-clamp-2 text-[14px] leading-[21px] text-white/55">{report.summary}</p>
        )}
      </div>

      <span className="hidden shrink-0 text-[13px] font-medium text-white/40 transition-colors group-hover:text-white sm:inline">
        Read PDF →
      </span>
    </Link>
  );
}

export function ReportsView({ reports }: { reports: ClassReport[] }) {
  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <EducationTabs current="reports" />
      <Panel title="Class reports" sub="Written recaps of every live class, as PDFs">
        {reports.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">
            No reports yet. A recap lands here after each class.
          </p>
        ) : (
          <div className="-my-1 divide-y divide-white/[0.07]">
            {reports.map((r) => (
              <ReportRow key={r.slug} report={r} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
