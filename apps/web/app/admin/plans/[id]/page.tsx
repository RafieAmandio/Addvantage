import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlanByIdForAdmin } from "@/features/plan/queries/plans";
import { requireAdmin } from "@/lib/auth/session";
import { PlanEditorForm } from "@/features/plan/components/admin/PlanEditorForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const plan = await getPlanByIdForAdmin(params.id);
  if (!plan) return { title: "Not Found" };
  return { title: `Edit: ${plan.symbol} ${plan.direction}` };
}

export default async function AdminPlanEditorPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const plan = await getPlanByIdForAdmin(params.id);
  if (!plan) return notFound();
  return <PlanEditorForm plan={plan} />;
}
