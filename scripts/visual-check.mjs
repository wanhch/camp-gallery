import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:8787";
const outputDir = new URL("../artifacts/visual/", import.meta.url);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const issues = [];

async function measureSceneDelta(page, waitMs = 240) {
  return page.locator('.dawn-canvas[data-scene="736-lights-16-nodes"]').evaluate(async (canvas, delay) => {
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const sample = () => {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const stride = Math.max(4, Math.floor(pixels.length / 9000 / 4) * 4);
      const values = [];
      for (let index = 0; index < pixels.length; index += stride) {
        values.push(pixels[index], pixels[index + 1], pixels[index + 2]);
      }
      return values;
    };
    const before = sample();
    await new Promise((resolve) => setTimeout(resolve, delay));
    const after = sample();
    let changed = 0;
    for (let index = 0; index < before.length; index += 1) {
      if (Math.abs(before[index] - after[index]) > 3) changed += 1;
    }
    return changed;
  }, waitMs);
}

async function inspectViewport(name, viewport, mobile = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`${name} console: ${message.text()}`);
  });
  page.on("pageerror", (error) => issues.push(`${name} page: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#gallery .media-card");
  await page.screenshot({ path: new URL(`${name}-home.png`, outputDir).pathname, fullPage: false });
  const sceneDelta = await measureSceneDelta(page);
  await page.getByRole("button", { name: "暂停动态" }).click();
  await page.waitForTimeout(120);
  const pausedSceneDelta = await measureSceneDelta(page);
  await page.getByRole("button", { name: "继续动态" }).click();
  for (const [selector, suffix] of [["#companies", "companies"], ["#gallery", "gallery"], [".official-section", "official"]]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
    await page.screenshot({ path: new URL(`${name}-${suffix}.png`, outputDir).pathname, fullPage: false });
  }

  const pageReport = await page.evaluate(() => {
    const canvas = document.querySelector(".dawn-canvas");
    const context2d = canvas?.getContext("2d");
    let activePixels = 0;
    if (canvas && context2d && canvas.width && canvas.height) {
      const data = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
      const stride = Math.max(4, Math.floor(data.length / 16000 / 4) * 4);
      for (let index = 0; index < data.length; index += stride) {
        if (data[index] + data[index + 1] + data[index + 2] > 60) activePixels += 1;
      }
    }
    const heroScene = document.querySelector('.dawn-canvas[data-scene="736-lights-16-nodes"]');
    const officialCover = document.querySelector(".official-video img");
    const cursorLayer = document.querySelector(".sugon-cursor-layer");
    const mobileNav = document.querySelector(".mobile-nav");
    const mobileBounds = mobileNav?.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      heroSceneReady: Boolean(heroScene && heroScene.width > 0 && heroScene.height > 0),
      officialCoverLoaded: Boolean(officialCover?.complete && officialCover.naturalWidth > 0),
      customCursorVisible: Boolean(cursorLayer && getComputedStyle(cursorLayer).display !== "none"),
      heroHeight: Math.round(document.querySelector(".hero")?.getBoundingClientRect().height || 0),
      activeCanvasPixels: activePixels,
      mediaCards: document.querySelectorAll(".media-card").length,
      mobileNavVisible: mobileBounds ? mobileBounds.width > 0 && getComputedStyle(mobileNav).display !== "none" : false,
      mobileNavInsideViewport: mobileBounds ? mobileBounds.left >= 0 && mobileBounds.right <= window.innerWidth && mobileBounds.bottom <= window.innerHeight : true
    };
  });
  const report = { ...pageReport, sceneDelta, pausedSceneDelta };

  if (report.overflowX) issues.push(`${name}: horizontal overflow (${report.documentWidth}px > ${report.viewport.width}px)`);
  if (!report.heroSceneReady) issues.push(`${name}: dynamic hero scene did not initialize`);
  if (!report.officialCoverLoaded) issues.push(`${name}: official community cover did not load`);
  if (report.activeCanvasPixels < 20) issues.push(`${name}: canvas appears blank (${report.activeCanvasPixels} active samples)`);
  if (report.sceneDelta < 20) issues.push(`${name}: dynamic canvas did not visibly change (${report.sceneDelta} changed channels)`);
  if (report.pausedSceneDelta > 3) issues.push(`${name}: paused canvas still changed (${report.pausedSceneDelta} changed channels)`);
  if (mobile && (!report.mobileNavVisible || !report.mobileNavInsideViewport)) issues.push(`${name}: mobile navigation is missing or outside viewport`);
  if (!mobile && !report.customCursorVisible) issues.push(`${name}: custom Sugon cursor did not mount`);
  if (mobile && report.customCursorVisible) issues.push(`${name}: custom cursor should be disabled for touch input`);

  if (!mobile) {
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: 480, clientY: 420, bubbles: true }));
      window.dispatchEvent(new PointerEvent("pointerdown", { clientX: 480, clientY: 420, button: 0, bubbles: true }));
    });
    await page.waitForTimeout(90);
    const launchedCursor = await page.locator(".sugon-cursor.is-launched").count();
    const sparkCount = await page.locator(".sugon-cursor-spark").count();
    await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { button: 0, bubbles: true })));
    if (!launchedCursor || sparkCount < 5) issues.push(`${name}: cursor launch/spark interaction did not render`);
  }

  await page.getByRole("button", { name: "打开分享二维码" }).click();
  await page.waitForSelector(".qr-code-wrap img");
  await page.screenshot({ path: new URL(`${name}-qr.png`, outputDir).pathname, fullPage: false });
  const qrLoaded = await page.locator(".qr-code-wrap img").evaluate((image) => image.complete && image.naturalWidth > 0);
  if (!qrLoaded) issues.push(`${name}: QR image did not render`);
  await page.getByRole("button", { name: "关闭二维码" }).click();

  const uploadButton = mobile
    ? page.getByRole("button", { name: "上传照片或视频" })
    : page.getByRole("button", { name: "上传此刻" }).first();
  await uploadButton.click();
  await page.waitForSelector(".upload-modal");
  await page.screenshot({ path: new URL(`${name}-upload.png`, outputDir).pathname, fullPage: false });
  const modalReport = await page.locator(".upload-modal").evaluate((modal) => {
    const bounds = modal.getBoundingClientRect();
    return {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  });
  if (modalReport.left < 0 || modalReport.right > modalReport.viewportWidth || modalReport.top < 0 || modalReport.bottom > modalReport.viewportHeight + 1) {
    issues.push(`${name}: upload modal escapes viewport`);
  }

  await context.close();
  return report;
}

const desktop = await inspectViewport("desktop-1440", { width: 1440, height: 1000 });
const mobile = await inspectViewport("mobile-375", { width: 375, height: 812 }, true);

const reducedContext = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: "reduce" });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
const reducedCanvasPixels = await reducedPage.locator(".dawn-canvas").evaluate((canvas) => {
  const context = canvas.getContext("2d");
  if (!context) return 0;
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let index = 0; index < data.length; index += 400) {
    if (data[index] + data[index + 1] + data[index + 2] > 60) count += 1;
  }
  return count;
});
if (reducedCanvasPixels < 10) issues.push("reduced-motion: static canvas final state is blank");
await reducedContext.close();
await browser.close();

const finalReport = JSON.stringify({ desktop, mobile, reducedCanvasPixels, issues }, null, 2);
await writeFile(new URL("report.json", outputDir), finalReport);
console.log(finalReport);
if (issues.length) process.exitCode = 1;
