"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { NewsItemEditSchema } from "@tradevantage/shared";
import type { TablesUpdate } from "@tradevantage/db";

type NewsUpdate = TablesUpdate<"news_items">;

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

  const update: NewsUpdate = {
    ...parse.data,
    updated_at: new Date().toISOString(),
  };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("news_items")
    .update(update)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/review/${id}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function approveItem(id: string): Promise<void> {
  const admin = await requireAdmin();
  const update: NewsUpdate = {
    status: "approved",
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  };
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("news_items")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/review");
  revalidatePath("/app/news");
  redirect("/admin/review");
}

export async function rejectItem(id: string): Promise<void> {
  const admin = await requireAdmin();
  const update: NewsUpdate = {
    status: "rejected",
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
    published_at: null,
  };
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("news_items")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/review");
  revalidatePath("/admin/archive");
  redirect("/admin/review");
}
