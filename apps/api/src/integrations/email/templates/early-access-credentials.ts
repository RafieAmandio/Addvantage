export interface EarlyAccessCredentialsParams {
  email: string;
  tempPassword: string;
  loginUrl: string;
}

const BRAND = "#FFD400";
const INK = "#111111";
const PAPER = "#EEEEEE";
const DARK = "#1A1A1A";
const MUTED = "#9A9A9A";
const MONO = "'Courier New', Courier, monospace";
const SITE = "https://tradevantage.gg";
const LOGO = "https://tradevantage.gg/figma/logo-mark.png";

// Self-contained, table-based, inline-styled email so it renders across clients.
// Same tactical/intel brand as the early-access confirmation: yellow logo mark,
// a monospace credentials block, yellow "log in" CTA, dark footer. Sent when an
// admin provisions a paid applicant into a real account.
export function earlyAccessCredentialsEmail(
  params: EarlyAccessCredentialsParams,
): { subject: string; html: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your account is ready</title>
</head>
<body style="margin:0;padding:0;background:${INK};font-family:${MONO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">

          <!-- Intro (light) -->
          <tr>
            <td style="background:${PAPER};padding:28px 32px 4px;" align="center">
              <img src="${LOGO}" width="30" height="30" alt="+vantage" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;" />
              <span style="font-family:${MONO};font-weight:bold;font-size:18px;color:${INK};vertical-align:middle;">&nbsp;+vantage</span>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:20px 32px 8px;" align="center">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#111;font-weight:bold;">Access // Granted</div>
              <div style="font-family:${MONO};font-size:26px;font-weight:bold;color:${INK};margin-top:10px;">Your account is ready.</div>
              <p style="font-family:${MONO};font-size:14px;line-height:1.6;color:#333;margin:14px 0 0;">
                Payment confirmed. Here are your login details, operator. Sign in, then change your password right away.
              </p>
            </td>
          </tr>

          <!-- Credentials block (light) -->
          <tr>
            <td style="background:${PAPER};padding:16px 32px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid ${INK};">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#777;">Email</div>
                    <div style="font-family:${MONO};font-size:15px;font-weight:bold;color:${INK};margin-top:4px;word-break:break-all;">${params.email}</div>
                    <div style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#777;margin-top:14px;">Temporary password</div>
                    <div style="font-family:${MONO};font-size:18px;font-weight:bold;color:${INK};margin-top:4px;letter-spacing:1px;word-break:break-all;">${params.tempPassword}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${PAPER};padding:18px 32px 28px;" align="center">
              <a href="${params.loginUrl}" style="display:inline-block;background:${BRAND};color:${INK};font-family:${MONO};font-weight:bold;font-size:14px;text-decoration:none;padding:14px 30px;box-shadow:4px 4px 0 ${INK};">Log in</a>
              <p style="font-family:${MONO};font-size:12px;line-height:1.6;color:#444;margin:16px 0 0;">
                After logging in, go to <strong>Settings</strong> and set a new password. This temporary one only works until you change it. If you did not expect this, reply to this email.
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
                      <img src="${LOGO}" width="24" height="24" alt="+vantage" style="display:inline-block;vertical-align:middle;border:0;border-radius:5px;" />
                      <span style="font-family:${MONO};font-weight:bold;font-size:16px;color:${PAPER};vertical-align:middle;">&nbsp;+vantage</span>
                    </div>
                    <p style="font-family:${MONO};font-size:11px;line-height:1.6;color:${MUTED};margin:12px 0 0;">
                      +vantage does not manage funds and accepts no liability for trading decisions made by recipients. Liability waiver enforced at signup.
                    </p>
                  </td>
                  <td valign="top" style="width:42%;padding-left:16px;">
                    <div style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${PAPER};font-weight:bold;">Surface</div>
                    <div style="font-family:${MONO};font-size:12px;color:${MUTED};margin-top:10px;line-height:1.9;">
                      <a href="${SITE}" style="color:${MUTED};text-decoration:none;">tradevantage.gg</a><br />
                      Telegram (free pillars)<br />
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
    subject: "Your TradeVantage account is ready",
    html,
  };
}
