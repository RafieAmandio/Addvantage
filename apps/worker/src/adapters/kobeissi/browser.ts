import puppeteer, { type Browser, type Page } from "puppeteer";
import path from "path";
import fs from "fs";

const USER_DATA_DIR = path.resolve(
  process.env.KOBEISSI_PROFILE_DIR ??
    path.join(process.cwd(), ".kobeissi-profile")
);

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;

  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  browser = await puppeteer.launch({
    headless: true,
    channel: "chrome",
    userDataDir: USER_DATA_DIR,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
}

export async function getPage(): Promise<Page> {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser?.connected) {
    await browser.close();
    browser = null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const page = await getPage();
  try {
    await page.goto("https://www.thekobeissiletter.com/members/home", {
      waitUntil: "networkidle2",
      timeout: 15_000,
    });
    const url = page.url();
    // If redirected to sign-in, not logged in
    return !url.includes("/sign-in") && !url.includes("/account/sign");
  } finally {
    await page.close();
  }
}
