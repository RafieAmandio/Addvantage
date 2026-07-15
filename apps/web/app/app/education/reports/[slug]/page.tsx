import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { listReports } from "@/features/reports/queries/reports";
import { ReportView } from "@/features/reports/components/ReportView";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);
  if (!hasAccess) redirect("/app/education/reports");

  const reports = await listReports();
  const index = reports.findIndex((r) => r.slug === params.slug);
  if (index === -1) notFound();

  return (
    <ReportView
      report={reports[index]}
      index={index}
      prev={index > 0 ? reports[index - 1] : null}
      next={index < reports.length - 1 ? reports[index + 1] : null}
    />
  );
}
