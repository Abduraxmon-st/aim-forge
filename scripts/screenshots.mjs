import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const [name, path] of [
  ["home", "/"],
  ["library", "/training/"],
  ["setup", "/setup/sphere-flick/"],
  ["settings", "/settings/"],
]) {
  await page.goto("http://127.0.0.1:4173" + path);
  await page.locator("h1").waitFor();
  await page.screenshot({ path: ".qa/" + name + ".png", fullPage: true });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:4173/");
await page.locator("h1").waitFor();
await page.screenshot({ path: ".qa/mobile.png", fullPage: true });
console.log(JSON.stringify({ pageErrors: errors }));
await browser.close();
