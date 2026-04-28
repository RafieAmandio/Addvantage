import type { Request, Response, NextFunction } from "express";
import { logger } from "../../config/logger.js";
import { AppError } from "../errors/index.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
    });
    return;
  }

  logger.error({ err, requestId: req.id, path: req.path }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
}
