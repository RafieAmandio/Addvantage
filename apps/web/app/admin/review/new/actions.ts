"use server";

import { createHash } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { enforceAdminRateLimit } from "@/lib/admin-ratelimit";
import { logger } from "@/lib/logger";
import { NewsItemCreateSchema } from "@tradevantage/shared";
import type { TablesInsert } from "@tradevantage/db";

const ADMIN_SCOPE = "admin.review";

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

function contentHash(parts: (string | null | undefined)[]): string {
  const joined = parts
    .filter(Boolean)
    .map((s) => String(s).replace(/\s+/g, " ").trim())
    .join("␞");
  return createHash("sha256").update(joined).digest("hex");
}

export async function createNewsItem(
  _prev: CreateFormState,
  formData: FormData,
): Promise<CreateFormState> {
  const admin = await requireAdmin();
  try {
    await enforceAdminRateLimit(admin.id, "createNews", ADMIN_SCOPE);
  } catch {
    return { ok: false, error: "rate_limited" };
  }

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

  const data = parse.data;
  const now = new Date().toISOString();
  const hash = contentHash([data.source_code, "manual", data.headline]);

  const insert: TablesInsert<"news_items"> = {
    source_code: data.source_code,
    source_url: data.source_url,
    raw_text: data.raw_text,
    content_hash: hash,
    headline: data.headline,
    rephrased: data.rephrased,
    analysis: data.analysis,
    impact: data.impact,
    bias: data.bias,
    affects: data.affects,
    tags: data.tags,
    author: data.author,
    status: "pending",
    fetched_at: now,
    created_at: now,
    updated_at: now,
  };

  const supabase = supabaseServer();
  const { data: row, error } = await supabase
    .from("news_items")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "admin.createNews" },
    });
    logger.error("createNewsItem failed", { error, scope: "admin.createNews" });
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/review");
  redirect(`/admin/review/${row.id}`);
}
