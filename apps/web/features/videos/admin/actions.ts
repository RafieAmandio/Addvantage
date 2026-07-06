"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost, apiPut, apiDelete } from "@/lib/api/client-server";
import { parseVideoRef } from "@/features/videos/lib/youtube";

export type VideoActionState = {
  ok: boolean;
  error?: string;
};

const videoFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().max(4000).default(""),
  category: z.enum(["analysis", "session"]),
  video: z
    .string()
    .min(1, "Video URL or ID is required")
    .refine((v) => parseVideoRef(v) !== null, {
      message: "Not a valid YouTube / Google Drive URL or video ID",
    }),
  duration: z.string().max(16).default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function parseForm(formData: FormData) {
  const parsed = videoFormSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    video: formData.get("video"),
    duration: formData.get("duration") ?? "",
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

function revalidateVideos() {
  revalidatePath("/admin/videos");
  revalidatePath("/app/education/videos");
}

export async function createVideo(
  _prev: VideoActionState,
  formData: FormData,
): Promise<VideoActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await apiPost("/videos", parsed.data);
  } catch {
    return { ok: false, error: "Create failed — is the slug unique?" };
  }
  revalidateVideos();
  redirect("/admin/videos");
}

export async function updateVideo(
  id: string,
  _prev: VideoActionState,
  formData: FormData,
): Promise<VideoActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await apiPut(`/videos/${encodeURIComponent(id)}`, parsed.data);
  } catch {
    return { ok: false, error: "Update failed — is the slug unique?" };
  }
  revalidateVideos();
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<void> {
  await requireAdmin();
  await apiDelete(`/videos/${encodeURIComponent(id)}`);
  revalidateVideos();
  redirect("/admin/videos");
}

export async function togglePublished(id: string, published: boolean): Promise<void> {
  await requireAdmin();
  await apiPut(`/videos/${encodeURIComponent(id)}`, { published });
  revalidateVideos();
}
