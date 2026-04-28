import { describe, it, expect, vi } from "vitest";
import { sendSuccess, sendPaginatedSuccess } from "./response.js";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import("express").Response;
}

describe("sendSuccess", () => {
  it("sends { success, data, message } with status 200", () => {
    const res = mockRes();
    sendSuccess(res, { id: "1", name: "test" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "1", name: "test" },
      message: "Success",
    });
  });

  it("accepts custom status and message", () => {
    const res = mockRes();
    sendSuccess(res, null, "Created", 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: "Created",
    });
  });
});

describe("sendPaginatedSuccess", () => {
  it("sends flat paginated shape matching frontend ApiResponse", () => {
    const res = mockRes();
    sendPaginatedSuccess(res, {
      content: [{ id: "1" }, { id: "2" }],
      page: 1,
      limit: 20,
      total: 42,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    const calls = (res.json as ReturnType<typeof vi.fn>).mock.calls;
    const body = calls[0]![0];
    expect(body.success).toBe(true);
    expect(body.data).toEqual([{ id: "1" }, { id: "2" }]);
    expect(body.total).toBe(42);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });
});
