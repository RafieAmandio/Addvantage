"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost } from "@/lib/api/client-server";

// Draw a random not-yet-won winner. The list re-renders with the new winner
// marked (wonAt set), so no return value is needed.
export async function drawGiveawayWinner(): Promise<void> {
  await requireAdmin();
  await apiPost("/giveaway/admin/draw");
  revalidatePath("/admin/giveaway");
}
