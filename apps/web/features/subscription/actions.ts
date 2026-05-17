"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { apiPost } from "@/lib/api/client-server";

interface ActionResult {
  ok: boolean;
  error?: string;
  invoiceUrl?: string;
}

export async function createSubscriptionInvoice(): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const data = await apiPost<{ invoiceUrl: string }>("/subscription/invoice", {
      tier: "vip",
      amount: 4_500_000,
      currency: "IDR",
      successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/app/subscription`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/app/subscription`,
    });
    return { ok: true, invoiceUrl: data.invoiceUrl };
  } catch {
    return { ok: false, error: "invoice_failed" };
  }
}

export async function requestDowngrade(): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await apiPost("/subscription/downgrade");
    revalidatePath("/app/subscription");
    return { ok: true };
  } catch {
    return { ok: false, error: "downgrade_failed" };
  }
}
