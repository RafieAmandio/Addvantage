export interface EarlyAccessInvoiceParams {
  reference: string;
  date: string;
  methodLabel: string;
  amountLabel: string;
}

const BRAND = "#FFD400";
const INK = "#111111";
const PAPER = "#EEEEEE";
const DARK = "#1A1A1A";
const MUTED = "#9A9A9A";
const MONO = "'Courier New', Courier, monospace";
const SITE = "https://tradevantage.gg";
const LOGO = "https://tradevantage.gg/figma/logo-mark.png";

// Invoice / receipt for the manual early-access payment. Sent alongside the
// welcome email. Table-based + inline styles so it renders across clients.
export function earlyAccessInvoiceEmail(
  p: EarlyAccessInvoiceParams,
): { subject: string; html: string } {
  const row = (label: string, value: string, top = true) => `
    <tr>
      <td style="font-family:${MONO};font-size:13px;color:#555;padding:8px 0;${top ? "border-top:1px solid rgba(17,17,17,0.12);" : ""}">${label}</td>
      <td align="right" style="font-family:${MONO};font-size:13px;color:${INK};font-weight:bold;padding:8px 0;${top ? "border-top:1px solid rgba(17,17,17,0.12);" : ""}">${value}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your TradeVantage invoice</title>
</head>
<body style="margin:0;padding:0;background:${INK};font-family:${MONO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">

          <!-- Header (light) -->
          <tr>
            <td style="background:${PAPER};padding:28px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="${LOGO}" width="30" height="30" alt="+vantage" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;" />
                    <span style="font-family:${MONO};font-weight:bold;font-size:18px;color:${INK};vertical-align:middle;">&nbsp;+vantage</span>
                  </td>
                  <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#111;font-weight:bold;">Invoice</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:16px 32px 4px;">
              <div style="font-family:${MONO};font-size:22px;font-weight:bold;color:${INK};">Payment received</div>
              <p style="font-family:${MONO};font-size:13px;line-height:1.6;color:#444;margin:8px 0 0;">
                Thanks. We have your early-access payment. This is your record of it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:12px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:${MONO};font-size:12px;color:#666;">Reference</td>
                  <td align="right" style="font-family:${MONO};font-size:12px;color:${INK};font-weight:bold;">${p.reference}</td>
                </tr>
                <tr>
                  <td style="font-family:${MONO};font-size:12px;color:#666;padding-top:4px;">Date</td>
                  <td align="right" style="font-family:${MONO};font-size:12px;color:${INK};font-weight:bold;padding-top:4px;">${p.date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line items (yellow band) -->
          <tr>
            <td style="background:${BRAND};padding:26px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${row("Item", "Founding Early Access", false)}
                ${row("Payment method", p.methodLabel)}
                ${row("Status", "Received, verifying")}
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:2px solid ${INK};">
                <tr>
                  <td style="font-family:${MONO};font-size:13px;color:${INK};font-weight:bold;padding-top:12px;text-transform:uppercase;letter-spacing:1px;">Total</td>
                  <td align="right" style="font-family:${MONO};font-size:20px;color:${INK};font-weight:bold;padding-top:12px;">${p.amountLabel}</td>
                </tr>
              </table>
              <p style="font-family:${MONO};font-size:12px;line-height:1.6;color:#3a3300;margin:16px 0 0;">
                We verify manual payments before granting access. Your access details follow in a separate email.
              </p>
            </td>
          </tr>

          <!-- Footer (dark) -->
          <tr>
            <td style="background:${DARK};padding:24px 32px;">
              <div>
                <img src="${LOGO}" width="22" height="22" alt="+vantage" style="display:inline-block;vertical-align:middle;border:0;border-radius:5px;" />
                <span style="font-family:${MONO};font-weight:bold;font-size:15px;color:${PAPER};vertical-align:middle;">&nbsp;+vantage</span>
              </div>
              <p style="font-family:${MONO};font-size:11px;line-height:1.6;color:${MUTED};margin:12px 0 0;">
                +vantage does not manage funds and accepts no liability for trading decisions made by recipients. ${SITE}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: "Your TradeVantage invoice",
    html,
  };
}
