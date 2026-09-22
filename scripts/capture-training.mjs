import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Screenshots of the real engines in isolated browser profiles. No sample
// history is written to the user's profile or included in the shipped app.
const ids = [
  "flick-burst",
  "micro-precision",
  "moving-clicks",
  "smooth-tracking",
  "reaction-tap",
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
];
await mkdir("public/training", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  for (const id of ids) {
    const context = await browser.newContext({
      locale: "en-US",
      viewport: { width: 1100, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.clock.install();
    await page.goto("http://127.0.0.1:4173/setup/" + id + "/");
    await page
      .getByRole("button", { name: "Enter training", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start round", exact: true })
      .click();
    await expect(page.locator(".arena-stage")).toHaveAttribute(
      "data-phase",
      "countdown",
    );
    await page.clock.runFor(3200);
    await expect(page.locator(".arena-stage")).toHaveAttribute(
      "data-phase",
      "running",
    );
    await page.clock.runFor(id === "reaction-tap" ? 1800 : 300);
    await page.locator(".arena-stage").screenshot({
      path: `public/training/${id}-1.jpg`,
      type: "jpeg",
      quality: 88,
    });
    if (ids.indexOf(id) >= 5) {
      await page.mouse.move(600, 430);
    } else if (id !== "reaction-tap") {
      const target = await page.locator("canvas").evaluate((canvas) => {
        const context = canvas.getContext("2d"),
          rect = canvas.getBoundingClientRect();
        const data = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        for (let y = 12; y < canvas.height - 12; y += 3)
          for (let x = 12; x < canvas.width - 12; x += 3) {
            const index = (y * canvas.width + x) * 4;
            if (
              data[index] > 160 &&
              data[index + 1] > 130 &&
              data[index + 1] < 190 &&
              data[index + 2] > 230
            )
              return {
                x: rect.left + (x / canvas.width) * rect.width,
                y: rect.top + ((y + 7) / canvas.height) * rect.height,
              };
          }
      });
      if (target) await page.mouse.click(target.x, target.y);
    }
    if (id.includes("tracking")) {
      await page.mouse.move(540, 410);
      await page.mouse.down();
    }
    await page.clock.runFor(950);
    await page.locator(".arena-stage").screenshot({
      path: `public/training/${id}-2.jpg`,
      type: "jpeg",
      quality: 88,
    });
    await context.close();
    console.log("Captured two live frames: " + id);
  }
} finally {
  await browser.close();
}
