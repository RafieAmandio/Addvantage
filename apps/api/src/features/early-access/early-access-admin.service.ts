import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { AppError } from "@/core/errors/index.js";
import { getEmailProvider, earlyAccessCredentialsEmail } from "@/integrations/email/index.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import { authService } from "@/features/auth/auth.service.js";
import { earlyAccessRepository } from "./early-access.repository.js";

// Paid subscription window end (matches the confirmation email copy).
const RENEWS_AT = new Date("2027-09-30T00:00:00.000Z");
const PROOF_BUCKET = "payment-proofs";

export const earlyAccessAdminService = {
  // Full application list for the admin table. Decimal → number for JSON.
  async list() {
    const rows = await earlyAccessRepository.listAll();
    return rows.map((r) => ({
      ...r,
      paymentAmount: r.paymentAmount == null ? null : Number(r.paymentAmount),
    }));
  },

  // Short-lived signed URL for the private payment-proof image.
  async proofUrl(id: string) {
    const app = await earlyAccessRepository.findById(id);
    if (!app) throw new AppError("Application not found", 404);
    if (!app.proofImageUrl) throw new AppError("No payment proof on file", 404);

    const storage = getStorageProvider();
    if (!storage?.getSignedUrl) {
      throw new AppError("Signed URLs not supported by the storage provider", 503);
    }
    const url = await storage.getSignedUrl(app.proofImageUrl, 300, PROOF_BUCKET);
    return { url };
  },

  // Turn a paid application into a real account and email the credentials.
  async provision(id: string) {
    const app = await earlyAccessRepository.findById(id);
    if (!app) throw new AppError("Application not found", 404);
    if (app.status === "provisioned") {
      throw new AppError("This application is already provisioned", 409);
    }

    const { profile, tempPassword } = await authService.provisionPaidAccount({
      email: app.email,
      renewsAt: RENEWS_AT,
    });

    let emailSent = false;
    const provider = getEmailProvider();
    if (provider) {
      try {
        const { subject, html } = earlyAccessCredentialsEmail({
          email: app.email,
          tempPassword,
          loginUrl: `${env.SITE_URL}/login`,
        });
        await provider.sendHtml({ to: { email: app.email }, subject, html });
        emailSent = true;
      } catch (err) {
        logger.error({ err: String(err), id }, "early-access: credentials email failed");
      }
    } else {
      logger.warn({ id }, "early-access: no email provider; credentials email skipped");
    }

    await earlyAccessRepository.markProvisioned(id, profile.id);
    logger.info({ id, accountId: profile.id, emailSent }, "early-access: account provisioned");

    // tempPassword returned so the admin can copy it if the email bounced.
    return { accountId: profile.id, email: app.email, tempPassword, emailSent };
  },
};
