import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { listReports } from "@/features/reports/queries/reports";
import { ReportsView } from "@/features/reports/components/ReportsView";
import { ReportsLocked } from "@/features/reports/components/ReportsLocked";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ClassReportsPage() {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);

  if (!hasAccess) return <ReportsLocked />;

  const reports = await listReports();
  return <ReportsView reports={reports} />;
}
