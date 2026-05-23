import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export const renameSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const appendMessageSchema = z.object({
  role: z.literal("user"),
  content: z.string().trim().min(1).max(10000),
  metadata: z.record(z.unknown()).optional(),
});

export const adminAppendMessageSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});
