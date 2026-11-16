import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { listReports } from "@/features/reports/queries/reports";
import { ReportView } from "@/features/reports/components/ReportView";

export const metadata: Metadata = { title: "Class Reports" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { slug: string } }) {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);
  if (!hasAccess) redirect("/app/education/reports");

  // The list is newest first and small, so one read gives the report and its neighbours.
  const reports = await listReports();
  const i = reports.findIndex((r) => r.slug === params.slug);
  if (i === -1) notFound();

  return (
    <ReportView
      report={reports[i]}
      newer={i > 0 ? reports[i - 1] : null}
      older={i < reports.length - 1 ? reports[i + 1] : null}
    />
  );
}
