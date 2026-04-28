import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request } from "express";
import type { PaymentProvider, PaymentEvent, VerifyResult } from "@/integrations/payment/index.js";
import type { EmailProvider, SendResult } from "@/integrations/email/index.js";
import { AppError, UnauthorizedError } from "@/core/errors/index.js";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock("@/integrations/payment/index.js", () => ({
  getPaymentProvider: vi.fn(),
}));

vi.mock("@/integrations/email/index.js", () => ({
  getEmailProvider: vi.fn(),
}));

vi.mock("./subscription.repository.js", () => ({
  subscriptionRepository: {
    updateTier: vi.fn(),
    findProfile: vi.fn(),
    insertEmailLog: vi.fn(),
  },
}));

/* Import after mocks so module resolution picks up stubs */
import { subscriptionService } from "./subscription.service.js";
import { getPaymentProvider } from "@/integrations/payment/index.js";
import { getEmailProvider } from "@/integrations/email/index.js";
import { subscriptionRepository } from "./subscription.repository.js";
import { env } from "@/config/env.js";

const mockGetPaymentProvider = vi.mocked(getPaymentProvider);
const mockGetEmailProvider = vi.mocked(getEmailProvider);
const repo = vi.mocked(subscriptionRepository);

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

function makeEvent(overrides: Partial<PaymentEvent> = {}): PaymentEvent {
  return {
    kind: "checkout_completed",
    externalRef: "ext-ref-001",
    profileId: "profile-001",
    tier: "pro",
    occurredAt: new Date("2025-01-15T12:00:00Z"),
    raw: { test: true },
    ...overrides,
  };
}

function makeProvider(verifyReturn: VerifyResult): PaymentProvider {
  return {
    name: "mock-payment",
    verifyWebhook: vi.fn().mockReturnValue(verifyReturn),
  };
}

function makeEmailProvider(sendResult: SendResult | null = { provider: "brevo", messageId: "msg-001" }): EmailProvider {
  return {
    name: "mock-email",
    sendTemplate: vi.fn().mockResolvedValue(sendResult),
  };
}

function makeFakeRequest(): Request {
  return {} as unknown as Request;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("subscriptionService.handleWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---- 1. No payment provider configured ---- */

  it("throws 503 when no payment provider configured", async () => {
    mockGetPaymentProvider.mockReturnValue(null);

    await expect(subscriptionService.handleWebhook(makeFakeRequest()))
      .rejects.toThrow(AppError);

    try {
      await subscriptionService.handleWebhook(makeFakeRequest());
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(503);
      expect((err as AppError).message).toBe("Payment provider not configured");
    }
  });

  /* ---- 2. Invalid webhook signature ---- */

  it("throws UnauthorizedError on invalid webhook signature", async () => {
    const provider = makeProvider({ valid: false, reason: "bad signature" });
    mockGetPaymentProvider.mockReturnValue(provider);

    await expect(subscriptionService.handleWebhook(makeFakeRequest()))
      .rejects.toThrow(UnauthorizedError);
  });

  /* ---- 3. checkout_completed - updates tier ---- */

  it("handles checkout_completed by updating tier", async () => {
    const event = makeEvent({ kind: "checkout_completed", profileId: "p-1", tier: "pro" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    repo.updateTier.mockResolvedValue(undefined as never);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(repo.updateTier).toHaveBeenCalledWith("p-1", "pro");
    expect(result).toEqual({ received: true });
  });

  /* ---- 4. checkout_completed - missing profileId ---- */

  it("throws 400 when checkout_completed is missing profileId", async () => {
    const event = makeEvent({ kind: "checkout_completed", profileId: undefined, tier: "pro" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    await expect(subscriptionService.handleWebhook(makeFakeRequest()))
      .rejects.toThrow(AppError);

    try {
      await subscriptionService.handleWebhook(makeFakeRequest());
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("throws 400 when checkout_completed is missing tier", async () => {
    const event = makeEvent({ kind: "checkout_completed", profileId: "p-1", tier: undefined });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    await expect(subscriptionService.handleWebhook(makeFakeRequest()))
      .rejects.toThrow(AppError);
  });

  /* ---- 5. Ignores non-terminal event kinds ---- */

  it("ignores non-terminal event kinds", async () => {
    const event = makeEvent({ kind: "subscription_renewed" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, ignored: "subscription_renewed" });
    expect(repo.updateTier).not.toHaveBeenCalled();
  });

  it("ignores subscription_cancelled event kind", async () => {
    const event = makeEvent({ kind: "subscription_cancelled" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, ignored: "subscription_cancelled" });
  });

  /* ---- 6. payment_failed with missing profileId ---- */

  it("returns missing_profile_id reason when payment_failed has no profileId", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: undefined });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({
      received: true,
      sent: false,
      reason: "missing_profile_id",
    });
  });

  /* ---- 7. payment_failed sends dunning email successfully ---- */

  it("sends dunning email on payment_failed", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);

    // Set DUNNING_TEMPLATE_ID
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    const profile = { email: "user@example.com", handle: "trader1", tier: "pro" };
    repo.findProfile.mockResolvedValue(profile as never);
    repo.insertEmailLog.mockResolvedValue(undefined as never);

    const emailProvider = makeEmailProvider({ provider: "brevo", messageId: "msg-123" });
    mockGetEmailProvider.mockReturnValue(emailProvider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: true });
    expect(emailProvider.sendTemplate).toHaveBeenCalledWith({
      to: { email: "user@example.com", name: "trader1" },
      templateId: 42,
      params: {
        tier: "pro",
        externalRef: event.externalRef,
        occurredAt: event.occurredAt.toISOString(),
      },
    });
    expect(repo.insertEmailLog).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "p-1",
        kind: "dunning",
        provider: "brevo",
        externalMessageId: "msg-123",
        templateId: "42",
      }),
    );
  });

  /* ---- 8. payment_failed handles missing email gracefully ---- */

  it("returns email_missing when profile has no email", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue({ email: null, handle: "nomail", tier: "free" } as never);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "email_missing" });
  });

  it("returns template_unset when DUNNING_TEMPLATE_ID is not set", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = undefined;

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "template_unset" });
  });

  it("returns profile_not_found when profile does not exist", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-missing" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue(null as never);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "profile_not_found" });
  });

  it("returns email_provider_unset when no email provider configured", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue({ email: "user@test.com", handle: null, tier: "pro" } as never);
    mockGetEmailProvider.mockReturnValue(null);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "email_provider_unset" });
  });

  /* ---- 9. payment_failed handles email send failure gracefully ---- */

  it("returns send_error when email send throws", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue({ email: "user@test.com", handle: "x", tier: "pro" } as never);

    const emailProvider = makeEmailProvider();
    (emailProvider.sendTemplate as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("SMTP down"));
    mockGetEmailProvider.mockReturnValue(emailProvider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "send_error" });
  });

  it("returns email_provider_unset when sendTemplate returns null", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue({ email: "user@test.com", handle: "x", tier: "pro" } as never);

    const emailProvider = makeEmailProvider(null);
    mockGetEmailProvider.mockReturnValue(emailProvider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    expect(result).toEqual({ received: true, sent: false, reason: "email_provider_unset" });
  });

  it("still returns sent: true even if email log insert fails", async () => {
    const event = makeEvent({ kind: "payment_failed", profileId: "p-1" });
    const provider = makeProvider({ valid: true, event });
    mockGetPaymentProvider.mockReturnValue(provider);
    (env as Record<string, unknown>).DUNNING_TEMPLATE_ID = 42;

    repo.findProfile.mockResolvedValue({ email: "user@test.com", handle: "x", tier: "pro" } as never);
    repo.insertEmailLog.mockRejectedValue(new Error("DB write failed"));

    const emailProvider = makeEmailProvider({ provider: "brevo", messageId: "msg-ok" });
    mockGetEmailProvider.mockReturnValue(emailProvider);

    const result = await subscriptionService.handleWebhook(makeFakeRequest());

    // Email was sent successfully; log failure is non-fatal
    expect(result).toEqual({ received: true, sent: true });
  });
});
