import path from "path";
import fs from "fs";

const COOKIE_FILE = path.resolve(
  process.env.KOBEISSI_COOKIE_FILE ??
    path.join(process.cwd(), ".kobeissi-cookies.json")
);

/**
 * Guides the user to export cookies from their real browser.
 *
 * Run: pnpm --filter @tradevantage/worker kobeissi:login
 */
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Kobeissi Letter — Cookie Setup                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Google blocks automated logins, so we use your real         ║
║  browser session instead.                                    ║
║                                                              ║
║  Steps:                                                      ║
║                                                              ║
║  1. Open Chrome → go to thekobeissiletter.com                ║
║  2. Make sure you're logged in (can see newsletters)         ║
║  3. Open DevTools (F12) → Application → Cookies              ║
║  4. Click on "https://www.thekobeissiletter.com"             ║
║  5. Right-click the cookie list → "Copy all as JSON"         ║
║     (or use the EditThisCookie extension to export)          ║
║  6. Paste/save the JSON into this file:                      ║
║                                                              ║
║     ${COOKIE_FILE}
║                                                              ║
║  OR: just copy the Cookie header from a network request:     ║
║                                                              ║
║  1. DevTools → Network tab → reload the page                 ║
║  2. Click any request to thekobeissiletter.com                ║
║  3. Copy the "Cookie" request header value                   ║
║  4. Set it as KOBEISSI_COOKIE in apps/worker/.env            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

  if (fs.existsSync(COOKIE_FILE)) {
    console.log(`✅ Cookie file found at ${COOKIE_FILE}`);
    try {
      const data = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf-8"));
      console.log(`   Contains ${Array.isArray(data) ? data.length : "?"} cookies`);
    } catch {
      console.log(`   ⚠ File exists but is not valid JSON`);
    }
  } else if (process.env.KOBEISSI_COOKIE) {
    console.log(`✅ KOBEISSI_COOKIE env var is set (${process.env.KOBEISSI_COOKIE.length} chars)`);
  } else {
    console.log(`❌ No cookies found. Follow the steps above.`);
  }
}

main();
