export interface EarlyAccessConfirmationParams {
  bonusMonths: number;
  subscriptionStart: string;
  freeThrough: string;
  subscriptionThrough: string;
  accessEmailDate: string;
}

const BRAND = "#FFD400";
const INK = "#111111";
const PAPER = "#EEEEEE";
const DARK = "#1A1A1A";
const MUTED = "#9A9A9A";
const MONO = "'Courier New', Courier, monospace";
const SITE = "https://tradevantage.gg";
const TELEGRAM_INVITE = "https://t.me/+CooIVleIU7w3MTll";
const TELEGRAM_NAME = "TradeVantage";
const SUPPORT_EMAIL = "tradevantage.gg@gmail.com";
const EXNESS_REF = "https://one.exnessonelink.com/a/ln6atwo69p";
const BITGET_REF = "https://partner.bitget.com/bg/TVantage";

// Self-contained, table-based, inline-styled email so it renders across clients.
// Tactical/intel brand: earth hero, yellow logo mark, yellow info band, dark
// footer. Scoped to the early-access confirmation (does not touch the shared
// transactional layout).
export function earlyAccessConfirmationEmail(
  params: EarlyAccessConfirmationParams,
): { subject: string; html: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Early access confirmed</title>
</head>
<body style="margin:0;padding:0;background:${INK};font-family:${MONO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">

          <!-- Hero + intro (light) -->
          <tr>
            <td style="background:${PAPER};padding:0;">
              <img src="${SITE}/figma/earth-1.png" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:8px 32px 4px;" align="center">
              <span style="display:inline-block;background:${BRAND};color:${INK};font-family:${MONO};font-weight:bold;font-size:15px;padding:3px 8px;">V</span>
              <span style="font-family:${MONO};font-weight:bold;font-size:18px;color:${INK};vertical-align:middle;">&nbsp;+vantage</span>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:20px 32px 8px;" align="center">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#111;font-weight:bold;">Early Access // Confirmed</div>
              <div style="font-family:${MONO};font-size:26px;font-weight:bold;color:${INK};margin-top:10px;">You're in, operator.</div>
              <p style="font-family:${MONO};font-size:14px;line-height:1.6;color:#333;margin:14px 0 0;">
                Your early-access request is in. You're locked in as a founding member.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:16px 32px 26px;" align="center">
              <a href="${TELEGRAM_INVITE}" style="display:inline-block;background:${BRAND};color:${INK};font-family:${MONO};font-weight:bold;font-size:14px;text-decoration:none;padding:14px 30px;box-shadow:4px 4px 0 ${INK};">Join the Telegram channel</a>
              <p style="font-family:${MONO};font-size:12px;line-height:1.6;color:#444;margin:16px 0 0;">
                If you&apos;re not in <strong>${TELEGRAM_NAME}</strong> yet, that&apos;s where the signal lives. Already in? Ignore this. Or visit <a href="${SITE}" style="color:${INK};font-weight:bold;">tradevantage.gg</a>.
              </p>
            </td>
          </tr>

          <!-- Key facts (yellow band) -->
          <tr>
            <td style="background:${BRAND};padding:26px 32px;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${INK};font-weight:bold;">What happens next</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;"><strong>+${params.bonusMonths} bonus months</strong> free, on the house as a founding early user.</td>
                </tr>
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;border-top:1px solid rgba(17,17,17,0.15);">Your subscription starts <strong>${params.subscriptionStart}</strong>, and from then through <strong>${params.freeThrough}</strong> is free.</td>
                </tr>
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;border-top:1px solid rgba(17,17,17,0.15);">Your subscription then runs through <strong>${params.subscriptionThrough}</strong>.</td>
                </tr>
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;border-top:1px solid rgba(17,17,17,0.15);">On <strong>${params.accessEmailDate}</strong> we'll email your access, with a link to set your password.</td>
                </tr>
              </table>
              <p style="font-family:${MONO};font-size:12px;line-height:1.6;color:#3a3300;margin:16px 0 0;">
                We're verifying your payment and broker details now. Nothing else is needed from you until then.
              </p>
            </td>
          </tr>

          <!-- Cashback referrals (light) -->
          <tr>
            <td style="background:${PAPER};padding:26px 32px;border-top:2px solid ${INK};">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${INK};font-weight:bold;">Cashback guarantee // Partner brokers</div>
              <p style="font-family:${MONO};font-size:13px;line-height:1.6;color:#333;margin:12px 0 16px;">
                Want the 100% cashback guarantee? Make sure your broker account is opened through one of these referral links, otherwise the cashback can't be tracked to you.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 10px 0 0;">
                    <a href="${EXNESS_REF}" style="display:inline-block;background:${INK};color:${PAPER};font-family:${MONO};font-weight:bold;font-size:13px;text-decoration:none;padding:11px 22px;">Open Exness &rarr;</a>
                  </td>
                  <td>
                    <a href="${BITGET_REF}" style="display:inline-block;background:${INK};color:${PAPER};font-family:${MONO};font-weight:bold;font-size:13px;text-decoration:none;padding:11px 22px;">Open Bitget &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="font-family:${MONO};font-size:12px;line-height:1.6;color:#444;margin:16px 0 0;">
                Already have an account with one of them? Email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${INK};font-weight:bold;">${SUPPORT_EMAIL}</a> and we'll get your referral switched over. We have the connection to change it.
              </p>
            </td>
          </tr>

          <!-- Footer (dark) -->
          <tr>
            <td style="background:${DARK};padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="width:58%;">
                    <div>
                      <span style="display:inline-block;background:${BRAND};color:${INK};font-family:${MONO};font-weight:bold;font-size:14px;padding:2px 7px;">V</span>
                      <span style="font-family:${MONO};font-weight:bold;font-size:16px;color:${PAPER};vertical-align:middle;">&nbsp;+vantage</span>
                    </div>
                    <p style="font-family:${MONO};font-size:11px;line-height:1.6;color:${MUTED};margin:12px 0 0;">
                      +vantage does not manage funds and accepts no liability for trading decisions made by recipients. Liability waiver enforced at signup.
                    </p>
                  </td>
                  <td valign="top" style="width:42%;padding-left:16px;">
                    <div style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${PAPER};font-weight:bold;">Surface</div>
                    <div style="font-family:${MONO};font-size:12px;color:${MUTED};margin-top:10px;line-height:1.9;">
                      Telegram (free pillars)<br />
                      DOMAIN web (paid)<br />
                      1v1 Consult
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: "You're in: TradeVantage early access",
    html,
  };
}
