import { chromium } from "playwright";

const base = process.env.SCREENSHOT_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: "public/portfolio-screenshot-landing.png" });

await page.goto(`${base}/demo/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "public/portfolio-screenshot.png" });

await browser.close();
console.log("Wrote public/portfolio-screenshot.png and public/portfolio-screenshot-landing.png");
