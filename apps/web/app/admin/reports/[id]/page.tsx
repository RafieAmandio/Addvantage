import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getReportForAdmin } from "@/features/reports/admin/queries";
import { ReportEditorForm } from "@/features/reports/components/admin/ReportEditorForm";

export const metadata: Metadata = { title: "Edit Report" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReportEditPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const report = await getReportForAdmin(params.id);
  if (!report) notFound();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 font-display text-4xl text-white">
        Edit <span className="italic text-brand">report</span>
      </h1>
      <ReportEditorForm report={report} />
    </div>
  );
}
