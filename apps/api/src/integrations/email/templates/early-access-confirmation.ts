export interface EarlyAccessConfirmationParams {
  bonusMonths: number;
  subscriptionStart: string;
  accessEmailDate: string;
}

const BRAND = "#FFD400";
const INK = "#111111";
const PAPER = "#EEEEEE";
const DARK = "#1A1A1A";
const MUTED = "#9A9A9A";
const MONO = "'Courier New', Courier, monospace";
const SITE = "https://tradevantage.gg";

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
            <td style="background:${PAPER};padding:20px 32px 28px;" align="center">
              <a href="${SITE}" style="display:inline-block;background:${BRAND};color:${INK};font-family:${MONO};font-weight:bold;font-size:14px;text-decoration:none;padding:14px 30px;box-shadow:4px 4px 0 ${INK};">Go to TradeVantage</a>
            </td>
          </tr>

          <!-- Key facts (yellow band) -->
          <tr>
            <td style="background:${BRAND};padding:26px 32px;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${INK};font-weight:bold;">What happens next</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;"><strong>+${params.bonusMonths} bonus months</strong> on top of your access.</td>
                </tr>
                <tr>
                  <td style="font-family:${MONO};font-size:14px;color:${INK};padding:6px 0;border-top:1px solid rgba(17,17,17,0.15);">Your subscription starts <strong>${params.subscriptionStart}</strong>.</td>
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
