import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "../error.middleware.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors/index.js";

function createApp(handler: express.RequestHandler) {
  const app = express();
  app.get("/test", handler);
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("converts NotFoundError to 404", async () => {
    const app = createApp((_req, _res, next) => next(new NotFoundError("Item not found")));
    const res = await request(app).get("/test");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });

  it("converts ForbiddenError to 403", async () => {
    const app = createApp((_req, _res, next) => next(new ForbiddenError("No access")));
    const res = await request(app).get("/test");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("No access");
  });

  it("converts ValidationError to 400 with errors array", async () => {
    const app = createApp((_req, _res, next) =>
      next(new ValidationError(["field is required"], "Invalid input")),
    );
    const res = await request(app).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid input");
    expect(res.body.errors).toEqual(["field is required"]);
  });

  it("converts unknown errors to 500", async () => {
    const app = createApp((_req, _res, next) => next(new Error("boom")));
    const res = await request(app).get("/test");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
