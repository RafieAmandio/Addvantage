import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const SourceRowSchema = z.object({
  code: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  poll_minutes: z.number(),
  last_polled_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
  last_error: z.string().nullable(),
});

export type SourceRow = z.infer<typeof SourceRowSchema>;

const SOURCE_LIST_COLUMNS =
  "code,name,url,enabled,poll_minutes,last_polled_at,last_success_at,last_error";

/** Admin-facing source registry, ordered by code. RLS gates write access. */
export async function listSources(): Promise<SourceRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("sources")
    .select(SOURCE_LIST_COLUMNS)
    .order("code");
  if (error) throw error;
  return SourceRowSchema.array().parse(data ?? []);
}
