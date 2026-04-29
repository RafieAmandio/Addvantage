const BRAND_COLOR = "#6366f1";

export function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 20px; color: ${BRAND_COLOR}; font-weight: 700; }
    .body-text { color: #27272a; font-size: 15px; line-height: 1.6; }
    .body-text p { margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; color: #a1a1aa; font-size: 12px; }
    .meta { background: #f4f4f5; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #52525b; }
    .meta strong { color: #27272a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>TradeVantage</h1></div>
      <div class="body-text">${body}</div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TradeVantage &middot; You received this because you have an account with us.
    </div>
  </div>
</body>
</html>`;
}
