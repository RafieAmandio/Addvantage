"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost } from "@/lib/api/client-server";
import { NewsItemCreateSchema } from "@tradevantage/shared";

export interface CreateFormState {
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

export async function createNewsItem(
  _prev: CreateFormState,
  formData: FormData,
): Promise<CreateFormState> {
  await requireAdmin();

  const sourceUrl = formData.get("source_url");
  const rawText = formData.get("raw_text");

  const parse = NewsItemCreateSchema.safeParse({
    headline: formData.get("headline"),
    rephrased: formData.get("rephrased"),
    analysis: formData.get("analysis"),
    impact: formData.get("impact"),
    bias: formData.get("bias"),
    affects: parseArrayField(formData.get("affects")),
    tags: parseArrayField(formData.get("tags")),
    author: formData.get("author"),
    source_code: formData.get("source_code"),
    source_url: sourceUrl ? String(sourceUrl) : null,
    raw_text: rawText ? String(rawText) : null,
  });

  if (!parse.success) {
    return {
      ok: false,
      error: parse.error.issues[0]?.message ?? "validation failed",
    };
  }

  try {
    const data = await apiPost<{ id: string }>("/news", parse.data);
    revalidatePath("/admin/review");
    redirect(`/admin/review/${data.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "create failed" };
  }
}
