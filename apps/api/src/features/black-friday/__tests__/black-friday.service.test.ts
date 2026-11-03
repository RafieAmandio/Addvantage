import { describe, it, expect, vi, beforeEach } from "vitest";
import { canOpenRoute, lossBucket, lossToUsd, BF_IDR_PER_USD } from "@tradevantage/shared";

const repo = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findByUid: vi.fn(),
  findById: vi.fn(),
  upsertDraft: vi.fn(),
  finalize: vi.fn(),
  listSubmitted: vi.fn(),
  countDrafts: vi.fn(),
  countDinnerInvites: vi.fn(),
  update: vi.fn(),
  findProfileByEmail: vi.fn(),
  setProfileAccess: vi.fn(),
}));
const { mockProvision, mockGetEmailProvider } = vi.hoisted(() => ({
  mockProvision: vi.fn(),
  mockGetEmailProvider: vi.fn().mockReturnValue(null),
}));

vi.mock("../black-friday.repository.js", () => ({ blackFridayRepository: repo }));
vi.mock("@/features/auth/auth.service.js", () => ({ authService: { provisionPaidAccount: mockProvision } }));
vi.mock("@/integrations/email/index.js", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/integrations/email/index.js");
  return { ...actual, getEmailProvider: mockGetEmailProvider };
});

import { blackFridayService, UID_TAKEN } from "../black-friday.service.js";
import { summariseBlackFriday as summarise } from "@tradevantage/shared/schema";
import { blackFridayAdminService, type AdminRow } from "../black-friday-admin.service.js";

const NOW = new Date("2026-11-28T00:00:00Z");
const YEAR = 365 * 24 * 3600 * 1000;

const input = {
  email: "a@b.co",
  name: "Ada Lovelace",
  contact: "@ada",
  answers: { experience: "1-3" as const, markets: ["crypto" as const], positionSize: "lt1k" as const },
  biggestLossAmount: 32_000_000,
  biggestLossCurrency: "IDR" as const,
  bingxUid: "123456789",
  bingxProofPath: "black-friday/x.png",
  plan: "full" as const,
  paymentMethod: "usdt" as const,
  paymentProofPath: "black-friday/y.png",
  signedName: "Ada Lovelace",
  acknowledgements: { risk: true as const, ownResearch: true as const, noGuarantee: true as const, terms: true as const },
};

const row = (o: Partial<AdminRow>): AdminRow =>
  ({ id: "x", plan: "free", status: "submitted", biggestLossUsd: 0, dinnerInvitedAt: null, ...o }) as AdminRow;

beforeEach(() => {
  vi.clearAllMocks();
  repo.update.mockImplementation(async (id: string, data: Record<string, unknown>) => ({ id, ...data }));
});

describe("USD normalisation and buckets", () => {
  it("converts IDR at the fixed rate and leaves USD alone", () => {
    expect(lossToUsd(BF_IDR_PER_USD * 250, "IDR")).toBe(250);
    expect(lossToUsd(1234.567, "USD")).toBe(1234.57);
    expect(lossToUsd(1_000, "IDR")).toBe(0.06);
  });

  it("puts each boundary in the upper bucket", () => {
    expect(lossBucket(0)).toBe("lt1k");
    expect(lossBucket(999.99)).toBe("lt1k");
    expect(lossBucket(1_000)).toBe("1k-10k");
    expect(lossBucket(10_000)).toBe("10k-50k");
    expect(lossBucket(50_000)).toBe("50k-100k");
    expect(lossBucket(100_000)).toBe("100k+");
    expect(lossBucket(9e9)).toBe("100k+");
  });

  it("groups rows, counts per plan, sorts by loss desc and totals paid Full", () => {
    const { groups, totals } = summarise(
      [
        row({ id: "a", biggestLossUsd: 200, plan: "free" }),
        row({ id: "b", biggestLossUsd: 900, plan: "full", status: "provisioned" }),
        row({ id: "c", biggestLossUsd: 5_000, plan: "full", status: "approved" }),
        row({ id: "d", biggestLossUsd: 250_000, plan: "full", status: "rejected" }),
        row({ id: "e", biggestLossUsd: 120_000, plan: "free" }),
      ],
      3,
    );
    const lt1k = groups.find((g) => g.key === "lt1k")!;
    expect(lt1k.count).toBe(2);
    expect(lt1k.byPlan).toEqual({ free: 1, full: 1 });
    expect(lt1k.items.map((r) => r.id)).toEqual(["b", "a"]);
    expect(groups.find((g) => g.key === "100k+")!.items.map((r) => r.id)).toEqual(["d", "e"]);
    expect(groups.map((g) => g.count)).toEqual([2, 1, 0, 0, 2]);
    expect(totals).toMatchObject({ applications: 5, drafts: 3, free: 2, full: 3, pending: 2, approved: 2, approvedFull: 2, paidUsd: 1000 });
  });
});

describe("blackFridayService", () => {
  it("submits with a USD-normalised loss and the server price", async () => {
    repo.findByUid.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue({ status: "draft" });
    repo.finalize.mockResolvedValue({ id: "app-1" });
    await expect(blackFridayService.submit(input)).resolves.toEqual({ id: "app-1" });
    expect(repo.finalize).toHaveBeenCalledWith(
      expect.objectContaining({ biggestLossUsd: 2000, paymentAmount: 500, paymentCurrency: "USDT", plan: "full" }),
    );
  });

  it("drops payment fields on the free plan", async () => {
    repo.findByUid.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.finalize.mockResolvedValue({ id: "app-2" });
    await blackFridayService.submit({ ...input, plan: "free" });
    expect(repo.finalize).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: null, paymentAmount: null, paymentProofPath: null }),
    );
  });

  it("refuses a UID used by another email, on draft and submit", async () => {
    repo.findByUid.mockResolvedValue({ id: "other", email: "someone@else.co" });
    await expect(blackFridayService.submit(input)).rejects.toMatchObject({ statusCode: 409, message: UID_TAKEN });
    await expect(
      blackFridayService.draft({ email: "a@b.co", name: "Ada", contact: "@ada", bingxUid: "123456789" }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.finalize).not.toHaveBeenCalled();
  });

  it("allows the same applicant to resubmit their own UID", async () => {
    repo.findByUid.mockResolvedValue({ id: "mine", email: "a@b.co" });
    repo.findByEmail.mockResolvedValue({ status: "submitted" });
    repo.finalize.mockResolvedValue({ id: "mine" });
    await expect(blackFridayService.submit(input)).resolves.toEqual({ id: "mine" });
  });

  it("maps a unique-index race to the friendly 409", async () => {
    repo.findByUid.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.finalize.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    await expect(blackFridayService.submit(input)).rejects.toMatchObject({ statusCode: 409, message: UID_TAKEN });
  });

  it("locks an application once reviewed", async () => {
    repo.findByUid.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue({ status: "approved" });
    await expect(blackFridayService.submit(input)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("blackFridayAdminService.approve", () => {
  it("full plan, new email: vip account for 365 days", async () => {
    repo.findById.mockResolvedValue({ id: "a1", email: "a@b.co", plan: "full", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue(null);
    mockProvision.mockResolvedValue({ profile: { id: "p1", tier: "vip" }, tempPassword: "pw" });
    const res = await blackFridayAdminService.approve("a1", NOW);
    expect(mockProvision).toHaveBeenCalledWith({ email: "a@b.co", tier: "vip", renewsAt: new Date(NOW.getTime() + YEAR) });
    expect(repo.update).toHaveBeenCalledWith("a1", expect.objectContaining({ status: "provisioned", accountId: "p1" }));
    expect(res).toMatchObject({ tempPassword: "pw", existingAccount: false });
  });

  it("free plan, new email: crypto account with no expiry", async () => {
    repo.findById.mockResolvedValue({ id: "a2", email: "c@d.co", plan: "free", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue(null);
    mockProvision.mockResolvedValue({ profile: { id: "p2", tier: "crypto" }, tempPassword: "pw" });
    await blackFridayAdminService.approve("a2", NOW);
    expect(mockProvision).toHaveBeenCalledWith({ email: "c@d.co", tier: "crypto", renewsAt: null });
  });

  it("full plan, existing vip: adds 365 days on top of the remaining time", async () => {
    const paidUntil = new Date(NOW.getTime() + 30 * 24 * 3600 * 1000);
    repo.findById.mockResolvedValue({ id: "a3", email: "e@f.co", plan: "full", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue({ id: "p3", tier: "vip", renewsAt: paidUntil });
    repo.setProfileAccess.mockResolvedValue({ id: "p3", tier: "vip", renewsAt: null });
    const res = await blackFridayAdminService.approve("a3", NOW);
    expect(repo.setProfileAccess).toHaveBeenCalledWith("p3", { tier: "vip", renewsAt: new Date(paidUntil.getTime() + YEAR) });
    expect(mockProvision).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith("a3", expect.objectContaining({ status: "approved", accountId: "p3" }));
    expect(res).toMatchObject({ existingAccount: true, emailSent: false });
  });

  it("full plan, existing free: upgrades to vip for 365 days from now", async () => {
    repo.findById.mockResolvedValue({ id: "a4", email: "g@h.co", plan: "full", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue({ id: "p4", tier: "free", renewsAt: null });
    repo.setProfileAccess.mockResolvedValue({ id: "p4", tier: "vip", renewsAt: null });
    await blackFridayAdminService.approve("a4", NOW);
    expect(repo.setProfileAccess).toHaveBeenCalledWith("p4", { tier: "vip", renewsAt: new Date(NOW.getTime() + YEAR) });
  });

  it("free plan, existing vip: leaves the account untouched", async () => {
    repo.findById.mockResolvedValue({ id: "a5", email: "i@j.co", plan: "free", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue({ id: "p5", tier: "vip", renewsAt: NOW });
    await blackFridayAdminService.approve("a5", NOW);
    expect(repo.setProfileAccess).not.toHaveBeenCalled();
    expect(mockProvision).not.toHaveBeenCalled();
  });

  it("free plan, existing free: moves to crypto", async () => {
    repo.findById.mockResolvedValue({ id: "a6", email: "k@l.co", plan: "free", status: "submitted" });
    repo.findProfileByEmail.mockResolvedValue({ id: "p6", tier: "free", renewsAt: null });
    repo.setProfileAccess.mockResolvedValue({ id: "p6", tier: "crypto", renewsAt: null });
    await blackFridayAdminService.approve("a6", NOW);
    expect(repo.setProfileAccess).toHaveBeenCalledWith("p6", { tier: "crypto" });
  });

  it("refuses to approve twice", async () => {
    repo.findById.mockResolvedValue({ id: "a7", email: "m@n.co", plan: "full", status: "provisioned" });
    await expect(blackFridayAdminService.approve("a7", NOW)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("blackFridayAdminService reject and dinner", () => {
  it("rejects with a note and sends nothing", async () => {
    repo.findById.mockResolvedValue({ id: "r1", status: "submitted" });
    await blackFridayAdminService.reject("r1", "UID screenshot unreadable");
    expect(repo.update).toHaveBeenCalledWith("r1", expect.objectContaining({ status: "rejected", reviewNote: "UID screenshot unreadable" }));
    expect(mockGetEmailProvider).not.toHaveBeenCalled();
  });

  it("invites approved Full members up to 10 seats and blocks the 11th", async () => {
    repo.findById.mockResolvedValue({ id: "d1", plan: "full", status: "provisioned", dinnerInvitedAt: null });
    repo.countDinnerInvites.mockResolvedValue(9);
    await expect(blackFridayAdminService.setDinnerInvite("d1", true)).resolves.toMatchObject({ id: "d1" });
    repo.countDinnerInvites.mockResolvedValue(10);
    await expect(blackFridayAdminService.setDinnerInvite("d1", true)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("only invites approved Full members", async () => {
    repo.findById.mockResolvedValue({ id: "d2", plan: "free", status: "provisioned", dinnerInvitedAt: null });
    await expect(blackFridayAdminService.setDinnerInvite("d2", true)).rejects.toMatchObject({ statusCode: 409 });
    repo.findById.mockResolvedValue({ id: "d3", plan: "full", status: "submitted", dinnerInvitedAt: null });
    await expect(blackFridayAdminService.setDinnerInvite("d3", true)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("uninviting frees a seat without a cap check", async () => {
    repo.findById.mockResolvedValue({ id: "d4", plan: "full", status: "approved", dinnerInvitedAt: NOW });
    await blackFridayAdminService.setDinnerInvite("d4", false);
    expect(repo.update).toHaveBeenCalledWith("d4", { dinnerInvitedAt: null });
    expect(repo.countDinnerInvites).not.toHaveBeenCalled();
  });
});

describe("canOpenRoute", () => {
  it("crypto opens news, the crypto radars and account basics only", () => {
    for (const p of ["/app/news", "/app/news/abc", "/app/unlocks", "/app/upgrades", "/app/settings", "/app/subscription"]) {
      expect(canOpenRoute("crypto", p)).toBe(true);
    }
    for (const p of ["/app", "/app/calendar", "/app/plan", "/app/consult", "/app/heatmap", "/app/newsletter"]) {
      expect(canOpenRoute("crypto", p)).toBe(false);
    }
  });

  it("free is unchanged: everything except the PRO items", () => {
    expect(canOpenRoute("free", "/app")).toBe(true);
    expect(canOpenRoute("free", "/app/calendar")).toBe(true);
    for (const p of ["/app/plan", "/app/consult", "/app/unlocks", "/app/upgrades"]) expect(canOpenRoute("free", p)).toBe(false);
  });

  it("vip opens everything", () => {
    for (const p of ["/app", "/app/plan", "/app/unlocks", "/app/anything"]) expect(canOpenRoute("vip", p)).toBe(true);
  });
});

describe("BlackFridayApplicationSchema", () => {
  it("needs a priced method and a receipt for Full, nothing for Free", async () => {
    const { BlackFridayApplicationSchema } = await import("@tradevantage/shared/schema");
    expect(BlackFridayApplicationSchema.safeParse(input).success).toBe(true);
    expect(BlackFridayApplicationSchema.safeParse({ ...input, paymentProofPath: undefined }).success).toBe(false);
    // BCA has no IDR price set, so it is refused.
    expect(BlackFridayApplicationSchema.safeParse({ ...input, paymentMethod: "bca" }).success).toBe(false);
    expect(
      BlackFridayApplicationSchema.safeParse({ ...input, plan: "free", paymentMethod: undefined, paymentProofPath: undefined }).success,
    ).toBe(true);
    expect(BlackFridayApplicationSchema.safeParse({ ...input, bingxUid: "12ab" }).success).toBe(false);
  });
});
