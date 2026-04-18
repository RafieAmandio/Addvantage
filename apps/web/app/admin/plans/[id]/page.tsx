import { notFound } from "next/navigation";
import { getPlanById } from "@/features/plan/queries/plans";
import { requireAdmin } from "@/lib/auth/session";
import { PlanEditorForm } from "@/features/plan/components/admin/PlanEditorForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlanEditorPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const plan = await getPlanById(params.id);
  if (!plan) return notFound();
  return <PlanEditorForm plan={plan} />;
}
