import { z } from "zod";

export const threadCreateSchema = z.object({
  title: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

export const threadUpdateSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const postCreateSchema = z.object({
  body: z.string().min(1),
  author: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  threadId: z.string().uuid().nullable().optional(),
});

export const postUpdateSchema = z.object({
  body: z.string().min(1).optional(),
  author: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  threadId: z.string().uuid().nullable().optional(),
});
