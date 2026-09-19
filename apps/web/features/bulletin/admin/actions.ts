"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost, apiPut, apiDelete } from "@/lib/api/client-server";
import {
  bulletinCreateSchema,
  BULLETIN_TIMEFRAMES,
  MARKET_STRUCTURES,
} from "@tradevantage/shared/schema";

export type BulletinActionState = { ok: boolean; error?: string };

function buildPayload(formData: FormData) {
  // One row per timeframe; a row with no market structure selected is skipped
  // (partial tables are allowed, like the source Notion board).
  const levels = BULLETIN_TIMEFRAMES.flatMap((tf) => {
    const ms = String(formData.get(`ms_${tf}`) ?? "");
    if (!(MARKET_STRUCTURES as readonly string[]).includes(ms)) return [];
    return [
      {
        timeframe: tf,
        marketStructure: ms,
        bosLevel: String(formData.get(`bos_${tf}`) ?? ""),
        comment: String(formData.get(`cmt_${tf}`) ?? ""),
      },
    ];
  });

  const parsed = bulletinCreateSchema.safeParse({
    symbol: formData.get("symbol"),
    status: formData.get("status"),
    bias: formData.get("bias"),
    whatToWatch: formData.get("whatToWatch") ?? "",
    entry: formData.get("entry") ?? "",
    exit: formData.get("exit") ?? "",
    note: formData.get("note") ?? "",
    levels,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }
  return { data: parsed.data } as const;
}

function revalidateBulletin() {
  revalidatePath("/admin/bulletin");
  revalidatePath("/app");
}

export async function createBulletin(
  _prev: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  await requireAdmin();
  const parsed = buildPayload(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    await apiPost("/bulletin", parsed.data);
  } catch {
    return { ok: false, error: "Create failed — is that symbol already on the board?" };
  }
  revalidateBulletin();
  redirect("/admin/bulletin");
}

export async function updateBulletin(
  id: string,
  _prev: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  await requireAdmin();
  const parsed = buildPayload(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    await apiPut(`/bulletin/${encodeURIComponent(id)}`, parsed.data);
  } catch {
    return { ok: false, error: "Update failed" };
  }
  revalidateBulletin();
  return { ok: true };
}

export async function deleteBulletin(id: string): Promise<void> {
  await requireAdmin();
  await apiDelete(`/bulletin/${encodeURIComponent(id)}`);
  revalidateBulletin();
  redirect("/admin/bulletin");
}
