import type { Response } from "express";

export function sendSuccess<T>(res: Response, content: T, message = "Success", status = 200) {
  res.status(status).json({ message, content });
}

export function sendPaginatedSuccess<T>(
  res: Response,
  data: {
    content: T[];
    page: number;
    limit: number;
    total: number;
  },
  message = "Success",
) {
  res.status(200).json({
    message,
    content: data.content,
    meta: {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: Math.ceil(data.total / data.limit),
    },
  });
}
