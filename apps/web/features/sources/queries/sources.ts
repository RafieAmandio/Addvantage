import { z } from "zod";
import { apiGet } from "@/lib/api/client-server";

const SourceRowSchema = z.object({
  code: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  pollMinutes: z.number(),
  lastPolledAt: z.string().nullable(),
  lastSuccessAt: z.string().nullable(),
  lastError: z.string().nullable(),
});

type SourceRow = z.infer<typeof SourceRowSchema>;

export async function listSources(): Promise<SourceRow[]> {
  const data = await apiGet<SourceRow[]>("/sources");
  return SourceRowSchema.array().parse(data ?? []);
}
