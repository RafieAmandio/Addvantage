import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { healthRoutes } from "./health.routes.js";

vi.mock("@/config/database.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

function createApp() {
  const app = express();
  app.use("/health", healthRoutes);
  return app;
}

describe("GET /health", () => {
  it("returns 200 when database is healthy", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.app).toBe("api");
    expect(res.body.checks.database.ok).toBe(true);
  });

  it("includes uptime_s and ts", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(typeof res.body.uptime_s).toBe("number");
    expect(typeof res.body.ts).toBe("string");
  });
});
