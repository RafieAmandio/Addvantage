import { cache } from "react";
import { PlanRowSchema, type Plan } from "@/features/plan/types";
import { isMockMode } from "@/lib/config/public";
import { mockPublishedPlans, mockPlanById } from "@/lib/mock/fixtures";
import { apiGet } from "@/lib/api/client-server";

export async function listPublishedPlans(
  input: { limit?: number; symbol?: string } = {},
): Promise<Plan[]> {
  if (isMockMode()) {
    const all = mockPublishedPlans().filter((p) => p.status === "published");
    const filtered = input.symbol
      ? all.filter((p) => p.symbol === input.symbol)
      : all;
    return filtered.slice(0, input.limit ?? 50);
  }
  try {
    const params = new URLSearchParams();
    if (input.limit) params.set("limit", String(input.limit));
    if (input.symbol) params.set("symbol", input.symbol);
    const qs = params.toString();
    const data = await apiGet<Plan[]>(`/plans${qs ? `?${qs}` : ""}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export const getPlanById = cache(async function getPlanById(id: string): Promise<Plan | null> {
  if (isMockMode()) return mockPlanById(id);
  try {
    return await apiGet<Plan>(`/plans/${id}`);
  } catch {
    return null;
  }
});

export const getPlanByIdForAdmin = cache(async function getPlanByIdForAdmin(id: string): Promise<Plan | null> {
  try {
    return await apiGet<Plan>(`/plans/admin/${id}`);
  } catch {
    return null;
  }
});

export async function listAllPlansForAdmin(limit = 100): Promise<Plan[]> {
  try {
    const data = await apiGet<Plan[]>(`/plans/admin/all?limit=${limit}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function listMyDraftPlans(
  input: { limit?: number } = {},
): Promise<Plan[]> {
  try {
    const limit = input.limit ?? 50;
    const data = await apiGet<Plan[]>(`/plans/admin/drafts?limit=${limit}`);
    return data ?? [];
  } catch {
    return [];
  }
}
