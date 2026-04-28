import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message = "Success", status = 200) {
  res.status(status).json({ success: true, data, message });
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
    data: result.content,
    total: result.total,
    page: result.page,
    limit: result.limit,
    message,
  });
}
