import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:5173";
const outputDir = new URL("../artifacts/visual/", import.meta.url);
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const issues = [];

async function inspect(name, viewport, mobile) {
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on("pageerror", (error) => issues.push(`${name}: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector('.dawn-canvas[data-scene="736-lights-16-nodes"]');
  await page.screenshot({ path: new URL(`${name}-hub.png`, outputDir).pathname, fullPage: false });
  const hub = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    actionCount: document.querySelectorAll(".hub-action-grid > a").length,
    mobileNav: getComputedStyle(document.querySelector(".mobile-nav")).display !== "none"
  }));
  if (hub.overflow) issues.push(`${name}: hub has horizontal overflow`);
  if (hub.actionCount !== 4) issues.push(`${name}: expected four hub actions`);
  if (mobile && !hub.mobileNav) issues.push(`${name}: mobile navigation is hidden`);

  await page.goto(`${baseUrl}/gallery`, { waitUntil: "networkidle" });
  await page.waitForSelector("#gallery .media-card");
  await page.screenshot({ path: new URL(`${name}-gallery.png`, outputDir).pathname, fullPage: false });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) issues.push(`${name}: gallery has horizontal overflow`);

  await page.goto(`${baseUrl}/upload`, { waitUntil: "networkidle" });
  await page.waitForSelector(".upload-step-card");
  await page.screenshot({ path: new URL(`${name}-upload.png`, outputDir).pathname, fullPage: false });
  const upload = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, steps: document.querySelectorAll(".upload-route-layout aside li").length }));
  if (upload.overflow) issues.push(`${name}: upload route has horizontal overflow`);
  if (upload.steps !== 3) issues.push(`${name}: upload journey does not contain three steps`);
  await context.close();
  return { hub, upload };
}

const desktop = await inspect("desktop-1440", { width: 1440, height: 1000 }, false);
const mobile = await inspect("mobile-390", { width: 390, height: 844 }, true);
await browser.close();
const report = JSON.stringify({ desktop, mobile, issues }, null, 2);
await writeFile(new URL("report.json", outputDir), report);
console.log(report);
if (issues.length) process.exitCode = 1;
