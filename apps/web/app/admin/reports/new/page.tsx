import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { ReportEditorForm } from "@/features/reports/components/admin/ReportEditorForm";

export const metadata: Metadata = { title: "New Report" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReportNewPage() {
  await requireAdmin();
  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 font-display text-4xl text-white">
        New <span className="italic text-brand">report</span>
      </h1>
      <ReportEditorForm report={null} />
    </div>
  );
}
