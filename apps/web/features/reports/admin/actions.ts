"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost, apiPut, apiDelete } from "@/lib/api/client-server";
import { parseDriveId } from "@/features/reports/lib/drive";

export type ReportActionState = {
  ok: boolean;
  error?: string;
};

const reportFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1, "Title is required").max(200),
  summary: z.string().max(2000).default(""),
  author: z.string().max(80).optional(),
  drive: z
    .string()
    .min(1, "Drive PDF link is required")
    .refine((v) => parseDriveId(v) !== null, {
      message: "Not a valid Google Drive file URL or id",
    }),
  publishedAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function parseForm(formData: FormData) {
  const publishedAtRaw = (formData.get("publishedAt") as string | null) ?? "";
  const authorRaw = (formData.get("author") as string | null) ?? "";
  const parsed = reportFormSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    author: authorRaw || undefined,
    drive: formData.get("drive"),
    publishedAt: publishedAtRaw || undefined,
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }
  return {
    data: {
      ...parsed.data,
      published: formData.get("published") === "on",
    },
  } as const;
}

function revalidateReports() {
  revalidatePath("/admin/reports");
  revalidatePath("/app/education/reports");
}

export async function createReport(
  _prev: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await apiPost("/reports", parsed.data);
  } catch {
    return { ok: false, error: "Create failed — is the slug unique?" };
  }
  revalidateReports();
  redirect("/admin/reports");
}

export async function updateReport(
  id: string,
  _prev: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await apiPut(`/reports/${encodeURIComponent(id)}`, parsed.data);
  } catch {
    return { ok: false, error: "Update failed — is the slug unique?" };
  }
  revalidateReports();
  return { ok: true };
}

export async function deleteReport(id: string): Promise<void> {
  await requireAdmin();
  await apiDelete(`/reports/${encodeURIComponent(id)}`);
  revalidateReports();
  redirect("/admin/reports");
}

export async function togglePublished(id: string, published: boolean): Promise<void> {
  await requireAdmin();
  await apiPut(`/reports/${encodeURIComponent(id)}`, { published });
  revalidateReports();
}
