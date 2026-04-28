"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { apiPut } from "@/lib/api/client-server";
import { NewsItemEditSchema } from "@tradevantage/shared";

interface FormState {
  ok: boolean;
  error?: string;
}

function parseArrayField(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveDraft(
  id: string,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parse = NewsItemEditSchema.safeParse({
    headline: formData.get("headline"),
    rephrased: formData.get("rephrased"),
    analysis: formData.get("analysis"),
    impact: formData.get("impact"),
    bias: formData.get("bias"),
    affects: parseArrayField(formData.get("affects")),
    tags: parseArrayField(formData.get("tags")),
    author: formData.get("author"),
  });
  if (!parse.success) {
    return { ok: false, error: parse.error.issues[0]?.message ?? "validation failed" };
  }

  try {
    await apiPut(`/news/${id}/draft`, parse.data);
    revalidatePath(`/admin/review/${id}`);
    revalidatePath("/admin/review");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "save failed" };
  }
}

export async function approveItem(id: string): Promise<void> {
  await requireAdmin();
  await apiPut(`/news/${id}/approve`);
  revalidatePath("/admin/review");
  revalidatePath("/app/news");
  redirect("/admin/review");
}

export async function rejectItem(id: string): Promise<void> {
  await requireAdmin();
  await apiPut(`/news/${id}/reject`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/archive");
  redirect("/admin/review");
}
