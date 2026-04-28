import { describe, it, expect } from "vitest";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "./validate.middleware.js";
import { errorHandler } from "./error.middleware.js";

const bodySchema = z.object({ name: z.string().min(1) });
const querySchema = z.object({ page: z.coerce.number().int().min(1) });
const paramsSchema = z.object({ id: z.string().uuid() });

function createApp(
  schemas: Parameters<typeof validate>[0],
  handler?: (req: Request, res: Response) => void,
) {
  const app = express();
  app.use(express.json());

  const defaultHandler = (req: Request, res: Response) => {
    res.status(200).json({
      body: req.body,
      query: req.query,
      params: req.params,
    });
  };

  app.post("/test/:id?", validate(schemas), handler ?? defaultHandler);

  app.use(errorHandler);

  return app;
}

describe("validate middleware", () => {
  describe("body validation", () => {
    it("passes when body is valid", async () => {
      const app = createApp({ body: bodySchema });
      const res = await request(app)
        .post("/test")
        .send({ name: "Alice" });

      expect(res.status).toBe(200);
      expect(res.body.body).toEqual({ name: "Alice" });
    });

    it("rejects invalid body with 400 and error messages", async () => {
      const app = createApp({ body: bodySchema });
      const res = await request(app)
        .post("/test")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatch(/^body\.name:/);
    });
  });

  describe("query validation", () => {
    it("validates query params and coerces types", async () => {
      const app = createApp({ query: querySchema });
      const res = await request(app)
        .post("/test?page=3")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.query).toEqual({ page: 3 });
    });

    it("rejects invalid query params", async () => {
      const app = createApp({ query: querySchema });
      const res = await request(app)
        .post("/test?page=0")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatch(/^query\.page:/);
    });
  });

  describe("params validation", () => {
    it("validates URL params", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const app = createApp({ params: paramsSchema });
      const res = await request(app)
        .post(`/test/${validUuid}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.params).toEqual({ id: validUuid });
    });

    it("rejects invalid URL params", async () => {
      const app = createApp({ params: paramsSchema });
      const res = await request(app)
        .post("/test/not-a-uuid")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatch(/^params\.id:/);
    });
  });

  describe("combined validation", () => {
    it("collects errors from body and query into a single response", async () => {
      const app = createApp({ body: bodySchema, query: querySchema });
      const res = await request(app)
        .post("/test?page=-1")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(2);

      const prefixes = res.body.errors.map((e: string) => e.split(".")[0]);
      expect(prefixes).toContain("body");
      expect(prefixes).toContain("query");
    });
  });

  describe("data transformation", () => {
    it("replaces req.body with parsed/transformed data", async () => {
      const trimSchema = z.object({
        email: z.string().email().transform((s) => s.toLowerCase()),
      });

      const app = createApp({ body: trimSchema }, (req: Request, res: Response) => {
        res.status(200).json({ email: req.body.email });
      });

      const res = await request(app)
        .post("/test")
        .send({ email: "USER@EXAMPLE.COM" });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("user@example.com");
    });
  });
});
