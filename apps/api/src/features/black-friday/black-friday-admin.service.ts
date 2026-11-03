import { logger } from "@/config/logger.js";
import { AppError } from "@/core/errors/index.js";
import { getEmailProvider, earlyAccessCredentialsEmail } from "@/integrations/email/index.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import { authService } from "@/features/auth/auth.service.js";
import {
  BF_DINNER_SEATS,
  BF_FULL_PRICE_USD,
  BF_LOSS_BUCKETS,
  lossBucket,
} from "@tradevantage/shared/schema";
import { blackFridayRepository } from "./black-friday.repository.js";

const PROOF_BUCKET = "payment-proofs";
const YEAR_MS = 365 * 24 * 3600 * 1000;
const APPROVED = new Set(["approved", "provisioned"]);
// Tiers a free-plan approval leaves alone. `free` and `visitor` move to `crypto`, the plan they applied for.
const KEEP_ON_FREE_PLAN = new Set(["vip", "crypto"]);

type Row = NonNullable<Awaited<ReturnType<typeof blackFridayRepository.findById>>>;

const num = (d: unknown) => (d == null ? null : Number(d));

/** Row as JSON for the admin table: Decimals to numbers, proof keys reduced to flags. */
export function toAdminRow(r: Row) {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    contact: r.contact,
    answers: r.answers,
    biggestLossAmount: num(r.biggestLossAmount),
    biggestLossCurrency: r.biggestLossCurrency,
    biggestLossUsd: num(r.biggestLossUsd) ?? 0,
    bingxUid: r.bingxUid,
    hasBingxProof: !!r.bingxProofPath,
    plan: r.plan,
    paymentMethod: r.paymentMethod,
    paymentAmount: num(r.paymentAmount),
    paymentCurrency: r.paymentCurrency,
    hasPaymentProof: !!r.paymentProofPath,
    status: r.status,
    reviewedAt: r.reviewedAt,
    reviewNote: r.reviewNote,
    dinnerInvitedAt: r.dinnerInvitedAt,
    accountId: r.accountId,
    createdAt: r.createdAt,
  };
}
export type AdminRow = ReturnType<typeof toAdminRow>;

/** The admin view: loss buckets (counts, per plan, rows by loss desc) and the totals strip. */
export function summarise(rows: AdminRow[], drafts = 0) {
  const groups = BF_LOSS_BUCKETS.map((b) => {
    const items = rows
      .filter((r) => lossBucket(r.biggestLossUsd) === b.key)
      .sort((a, z) => z.biggestLossUsd - a.biggestLossUsd);
    return {
      key: b.key,
      label: b.label,
      count: items.length,
      byPlan: { free: items.filter((r) => r.plan === "free").length, full: items.filter((r) => r.plan === "full").length },
      items,
    };
  });
  const approvedFull = rows.filter((r) => r.plan === "full" && APPROVED.has(r.status)).length;
  return {
    groups,
    totals: {
      applications: rows.length,
      drafts,
      free: rows.filter((r) => r.plan === "free").length,
      full: rows.filter((r) => r.plan === "full").length,
      pending: rows.filter((r) => r.status === "submitted").length,
      approved: rows.filter((r) => APPROVED.has(r.status)).length,
      rejected: rows.filter((r) => r.status === "rejected").length,
      approvedFull,
      paidUsd: approvedFull * BF_FULL_PRICE_USD,
      dinnerInvited: rows.filter((r) => r.dinnerInvitedAt).length,
      dinnerSeats: BF_DINNER_SEATS,
    },
  };
}

async function load(id: string) {
  const app = await blackFridayRepository.findById(id);
  if (!app) throw new AppError("Application not found", 404);
  return app;
}

export const blackFridayAdminService = {
  async list() {
    const [rows, drafts] = await Promise.all([blackFridayRepository.listSubmitted(), blackFridayRepository.countDrafts()]);
    return summarise(rows.map(toAdminRow), drafts);
  },

  async proofUrl(id: string, kind: "bingx" | "payment") {
    const app = await load(id);
    const key = kind === "bingx" ? app.bingxProofPath : app.paymentProofPath;
    if (!key) throw new AppError("No proof on file", 404);
    const storage = getStorageProvider();
    if (!storage?.getSignedUrl) throw new AppError("Signed URLs not supported by the storage provider", 503);
    return { url: await storage.getSignedUrl(key, 300, PROOF_BUCKET) };
  },

  /**
   * Approve and provision. No account yet: create one (full = vip for 365 days, free = crypto, no
   * expiry) and email the same credentials email apply sends. Account exists: never reset its
   * password, so no credentials email. Full upgrades it to vip and adds 365 days on top of any
   * remaining paid time; free leaves vip/crypto untouched and moves free/visitor to crypto.
   */
  async approve(id: string, now = new Date()) {
    const app = await load(id);
    if (app.status !== "submitted" && app.status !== "rejected") {
      throw new AppError(`This application is already ${app.status}`, 409);
    }
    const full = app.plan === "full";
    const existing = await blackFridayRepository.findProfileByEmail(app.email);

    if (existing) {
      let profile = existing;
      if (full) {
        const lifetime = existing.tier === "vip" && existing.renewsAt == null;
        if (!lifetime) {
          const paidUntil = existing.tier === "vip" && existing.renewsAt && existing.renewsAt > now ? existing.renewsAt : now;
          profile = await blackFridayRepository.setProfileAccess(existing.id, {
            tier: "vip",
            renewsAt: new Date(paidUntil.getTime() + YEAR_MS),
          });
        }
      } else if (!KEEP_ON_FREE_PLAN.has(existing.tier)) {
        profile = await blackFridayRepository.setProfileAccess(existing.id, { tier: "crypto" });
      }
      await blackFridayRepository.update(id, { status: "approved", reviewedAt: now, accountId: existing.id });
      logger.info({ id, accountId: existing.id, tier: profile.tier }, "black-friday: approved onto existing account");
      return {
        accountId: existing.id,
        email: app.email,
        existingAccount: true,
        tier: profile.tier,
        renewsAt: profile.renewsAt,
        tempPassword: null,
        emailSent: false,
      };
    }

    const { profile, tempPassword } = await authService.provisionPaidAccount({
      email: app.email,
      renewsAt: full ? new Date(now.getTime() + YEAR_MS) : null,
      tier: full ? "vip" : "crypto",
    });

    let emailSent = false;
    const provider = getEmailProvider();
    if (provider) {
      try {
        const { subject, html } = earlyAccessCredentialsEmail({
          email: app.email,
          tempPassword,
          // Production domain on purpose, same as early access.
          loginUrl: "https://tradevantage.gg/login",
          intro: full
            ? undefined
            : "Application approved. Your free account opens the crypto tools and the news desk. Sign in, then change your password right away.",
        });
        await provider.sendHtml({ to: { email: app.email }, subject, html });
        emailSent = true;
      } catch (err) {
        logger.error({ err: String(err), id }, "black-friday: credentials email failed");
      }
    } else {
      logger.warn({ id }, "black-friday: no email provider; credentials email skipped");
    }

    await blackFridayRepository.update(id, { status: "provisioned", reviewedAt: now, accountId: profile.id });
    logger.info({ id, accountId: profile.id, emailSent }, "black-friday: account provisioned");
    return { accountId: profile.id, email: app.email, existingAccount: false, tier: profile.tier, tempPassword, emailSent };
  },

  // No rejection email: apply never sends one either.
  async reject(id: string, note?: string) {
    const app = await load(id);
    if (app.status !== "submitted") throw new AppError(`This application is already ${app.status}`, 409);
    await blackFridayRepository.update(id, { status: "rejected", reviewedAt: new Date(), reviewNote: note || null });
    return { id, status: "rejected" };
  },

  /** The desk picks dinner guests by hand among approved Full applicants. Capped at BF_DINNER_SEATS. */
  async setDinnerInvite(id: string, invited: boolean) {
    const app = await load(id);
    if (!invited) {
      await blackFridayRepository.update(id, { dinnerInvitedAt: null });
      return { id, dinnerInvitedAt: null };
    }
    if (app.plan !== "full" || !APPROVED.has(app.status)) {
      throw new AppError("Only approved Full access members can be invited", 409);
    }
    if (app.dinnerInvitedAt) return { id, dinnerInvitedAt: app.dinnerInvitedAt };
    // ponytail: count-then-write, two admins clicking the 10th seat at once could make 11; add a DB lock if that ever matters.
    if ((await blackFridayRepository.countDinnerInvites()) >= BF_DINNER_SEATS) {
      throw new AppError(`All ${BF_DINNER_SEATS} dinner seats are taken`, 409);
    }
    const row = await blackFridayRepository.update(id, { dinnerInvitedAt: new Date() });
    return { id, dinnerInvitedAt: row.dinnerInvitedAt };
  },
};
