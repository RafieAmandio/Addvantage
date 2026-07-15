import { z } from "zod";

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{25,44}$/;

/**
 * Accepts a bare Google Drive file id or a Drive URL (file/d/{id}, open?id=,
 * /d/{id}) and returns the bare id. Returns null when none can be extracted.
 */
export function parseDriveId(input: string): string | null {
  const trimmed = input.trim();
  if (DRIVE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (/(^|\.)(drive|docs)\.google\.com$/.test(url.hostname)) {
    const fromParam = url.searchParams.get("id");
    if (fromParam && DRIVE_ID_RE.test(fromParam)) return fromParam;
    const pathId = url.pathname.match(/\/(?:file\/)?d\/([A-Za-z0-9_-]{25,44})/)?.[1];
    if (pathId) return pathId;
  }
  return null;
}

const driveField = z
  .string()
  .min(1)
  .transform((val, ctx) => {
    const id = parseDriveId(val);
    if (!id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid Google Drive file URL or id",
      });
      return z.NEVER;
    }
    return id;
  });

export const reportCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).default(""),
  author: z.string().max(80).optional(),
  drive: driveField,
  publishedAt: z.coerce.date().optional(),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export const reportUpdateSchema = reportCreateSchema.partial();

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
