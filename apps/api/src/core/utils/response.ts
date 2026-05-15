import type { Response } from "express";

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function snakeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(snakeKeys);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[toSnake(k)] = snakeKeys(v);
    }
    return out;
  }
  return obj;
}

export function sendSuccess<T>(res: Response, data: T, message = "Success", status = 200) {
  res.status(status).json({ success: true, data: snakeKeys(data), message });
}

export function sendPaginatedSuccess<T>(
  res: Response,
  result: {
    content: T[];
    page: number;
    limit: number;
    total: number;
  },
  message = "Success",
) {
  res.status(200).json({
    success: true,
    data: snakeKeys(result.content),
    total: result.total,
    page: result.page,
    limit: result.limit,
    message,
  });
}
