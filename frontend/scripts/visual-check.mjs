import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:5173";
const outputDir = fileURLToPath(new URL("../artifacts/visual/", import.meta.url));
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const issues = [];

async function inspect(name, viewport, mobile) {
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on("pageerror", (error) => issues.push(`${name}: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector('.dawn-canvas[data-scene="736-lights-16-nodes"]');
  await page.screenshot({ path: path.join(outputDir, `${name}-hub.png`), fullPage: false });
  const hub = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    mobileNav: getComputedStyle(document.querySelector(".mobile-nav")).display !== "none",
    journeyTargetsPresent: ["home", "companies", "live", "ranking"].every((id) => Boolean(document.getElementById(id))),
    snapType: getComputedStyle(document.querySelector("[data-scroll-root]")).scrollSnapType,
    companyCards: document.querySelectorAll(".company-card").length,
    headerLogoLoaded: (() => {
      const logo = document.querySelector(".site-header__logo img");
      return logo instanceof HTMLImageElement && logo.complete && logo.naturalWidth > 0;
    })()
  }));
  if (hub.overflow) issues.push(`${name}: hub has horizontal overflow`);
  if (mobile && !hub.mobileNav) issues.push(`${name}: mobile navigation is hidden`);
  if (!hub.journeyTargetsPresent) issues.push(`${name}: a scroll journey target is missing`);
  if (!hub.snapType.includes("mandatory")) issues.push(`${name}: home container lost scroll-snap`);
  if (hub.companyCards !== 16) issues.push(`${name}: expected sixteen company cards`);
  if (!hub.headerLogoLoaded) issues.push(`${name}: header logo failed to load`);

  await page.goto(`${baseUrl}/gallery`, { waitUntil: "networkidle" });
  await page.waitForSelector("#gallery .media-card");
  await page.screenshot({ path: path.join(outputDir, `${name}-gallery.png`), fullPage: false });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) issues.push(`${name}: gallery has horizontal overflow`);

  const companyResponse = await page.request.get(`${baseUrl}/api/v1/media?categoryId=10&limit=200`);
  const companyPayload = await companyResponse.json();
  await page.goto(`${baseUrl}/company/10?moment=demo-01`, { waitUntil: "networkidle" });
  await page.waitForSelector("#gallery");
  const company = await page.evaluate(() => ({
    summary: document.querySelector(".gallery-route-hero p")?.textContent || "",
    foreignLightboxOpen: Boolean(document.querySelector(".lightbox-modal"))
  }));
  if (!company.summary.includes(`共 ${companyPayload.total} 个集训瞬间`)) issues.push(`${name}: company summary uses the wrong media total`);
  if (company.foreignLightboxOpen) issues.push(`${name}: company route opened media from another category`);

  await page.goto(`${baseUrl}/upload`, { waitUntil: "networkidle" });
  await page.waitForSelector(".upload-step-card");
  await page.screenshot({ path: path.join(outputDir, `${name}-upload.png`), fullPage: false });
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
await writeFile(path.join(outputDir, "report.json"), report);
console.log(report);
if (issues.length) process.exitCode = 1;
