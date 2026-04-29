import { describe, it, expect } from "vitest";
import { pickReply, FREE_DAILY_TOKEN_CAP } from "../consult.lib.js";

describe("pickReply", () => {
  it("returns a non-empty string", () => {
    const reply = pickReply("hello", 0);
    expect(reply.length).toBeGreaterThan(0);
  });

  it("matches keyword patterns", () => {
    const sizeReply = pickReply("What about my position size?", 0);
    expect(sizeReply).toContain("position size");

    const lossReply = pickReply("I'm in a big drawdown", 0);
    expect(lossReply).toContain("loss aversion");
  });

  it("falls back to round-robin on no keyword match", () => {
    const reply0 = pickReply("general message", 0);
    const reply1 = pickReply("general message", 1);
    expect(reply0.length).toBeGreaterThan(0);
    expect(reply1.length).toBeGreaterThan(0);
  });

  it("handles all fallback indices without crashing", () => {
    for (let i = 0; i < 20; i++) {
      const reply = pickReply("random message", i);
      expect(reply.length).toBeGreaterThan(0);
    }
  });
});

describe("FREE_DAILY_TOKEN_CAP", () => {
  it("is 10000", () => {
    expect(FREE_DAILY_TOKEN_CAP).toBe(10_000);
  });
});
