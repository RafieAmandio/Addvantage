import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { PlanEditorForm } from "@/features/plan/components/admin/PlanEditorForm";

export const metadata: Metadata = { title: "New Plan" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlanNewPage() {
  await requireAdmin();
  return <PlanEditorForm plan={null} />;
}
