import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/index.js";

interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: string[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...flattenZodErrors(result.error, "body"));
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...flattenZodErrors(result.error, "query"));
      } else {
        (req as Request).query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...flattenZodErrors(result.error, "params"));
      } else {
        req.params = result.data;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    next();
  };
}

function flattenZodErrors(error: ZodError, prefix: string): string[] {
  return error.issues.map(
    (issue) => `${prefix}.${issue.path.join(".")}: ${issue.message}`,
  );
}
