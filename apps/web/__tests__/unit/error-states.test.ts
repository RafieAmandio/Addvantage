import { describe, it, expect } from "vitest";

// Verify the error boundary components are valid modules
// (runtime rendering is covered by Playwright integration tests)

describe("error boundary modules", () => {
  it("global error.tsx exports a default function", async () => {
    const mod = await import("@/app/error");
    expect(typeof mod.default).toBe("function");
  });

  it("app segment error.tsx exports a default function", async () => {
    const mod = await import("@/app/app/error");
    expect(typeof mod.default).toBe("function");
  });

  it("admin segment error.tsx exports a default function", async () => {
    const mod = await import("@/app/admin/error");
    expect(typeof mod.default).toBe("function");
  });
});

describe("not-found modules", () => {
  it("global not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("news/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/app/news/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("plan/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/app/plan/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("education/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/app/education/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("calendar/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/app/calendar/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("admin/review/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/admin/review/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });

  it("admin/plans/[id] not-found.tsx exports a default function", async () => {
    const mod = await import("@/app/admin/plans/[id]/not-found");
    expect(typeof mod.default).toBe("function");
  });
});
