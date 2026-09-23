import { test, expect, type Page } from "@playwright/test";
async function openRound(page: Page, id: string) {
  await page.clock.install();
  await page.goto("/setup/" + id + "/");
  await expect(
    page.getByRole("button", { name: "Enter training" }),
  ).toBeVisible();
  const thirty = page.getByRole("radio", { name: "30 s", exact: true });
  if (await thirty.isVisible()) await thirty.click();
  await page.getByRole("button", { name: "Enter training" }).click();
  await expect(
    page.getByRole("button", { name: "Start round", exact: true }),
  ).toBeVisible();
}

test("settings save automatically, survive navigation, and reject invalid edits", async ({
  page,
}) => {
  await page.goto("/settings/");
  await page
    .getByRole("textbox", { name: "Nickname (optional)" })
    .fill("My training profile");
  await page
    .getByRole("spinbutton", { name: "Sensitivity" })
    .fill("0.32938293829");
  await expect(
    page.getByRole("spinbutton", { name: "Sensitivity" }),
  ).toHaveValue("0.329");
  await page
    .getByRole("checkbox", { name: "Show measured FPS / frame time" })
    .check();
  await page.getByRole("combobox", { name: "Target palette" }).click();
  await page.getByRole("option", { name: "Cyan", exact: true }).click();
  await expect(page.locator(".settings-save-state")).toHaveText(
    "Saved on this device",
  );
  await page
    .getByRole("link", { name: "Training library", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Settings", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)" }),
  ).toHaveValue("My training profile");
  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "Sensitivity" }),
  ).toHaveValue("0.329");
  await expect(
    page.getByRole("checkbox", { name: "Show measured FPS / frame time" }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "Target palette" }),
  ).toHaveText("Cyan");
  await page
    .getByRole("textbox", { name: /Training timezone/ })
    .fill("Invalid/Timezone");
  await expect(
    page.getByRole("alert").filter({ hasText: "Check the settings" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nickname (optional)" })
    .fill("Valid edit still saves");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("aimforge:data:v2")!).settings
            .nickname,
      ),
    )
    .toBe("Valid edit still saves");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: /Training timezone/ }),
  ).not.toHaveValue("Invalid/Timezone");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)" }),
  ).toHaveValue("Valid edit still saves");
});

test("custom filters support keyboard selection and calendar dates on mobile", async ({
  page,
}) => {
  await page.goto("/training/");
  const dimension = page.getByRole("combobox", { name: "Dimension" });
  await dimension.focus();
  await dimension.press("ArrowDown");
  await dimension.press("End");
  await dimension.press("Enter");
  await expect(page.locator(".library-grid article")).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/history/");
  await page.getByRole("button", { name: "From date", exact: true }).click();
  const calendar = page.getByRole("dialog", { name: "From date", exact: true });
  await expect(calendar).toBeVisible();
  const bounds = await calendar.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(calendar).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "From date", exact: true }),
  ).not.toHaveText("From date");
  await page.getByRole("button", { name: "From date", exact: true }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "From date", exact: true }),
  ).toHaveText("From date");
  expect(await page.locator("select,input[type=date]").count()).toBe(0);
});

test("opening a select never scrolls the page and menu selection works on the first attempt", async ({
  page,
}) => {
  await page.goto("/settings/");
  for (const name of ["Language", "Target palette", "Render quality"]) {
    const trigger = page.getByRole("combobox", { name, exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - before),
    ).toBeLessThan(2);
    const menu = await page.getByRole("listbox").boundingBox();
    expect(menu!.y).toBeGreaterThanOrEqual(0);
    expect(menu!.y + menu!.height).toBeLessThanOrEqual(721);
    await trigger.press("Escape");
  }
  await page.getByRole("combobox", { name: "Target palette" }).click();
  await page.getByRole("option", { name: "Cyan", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Target palette" }),
  ).toHaveText("Cyan");
});

test("training cards have two columns, real screenshots and working carousel controls", async ({
  page,
}) => {
  await page.goto("/training/");
  const cards = page.locator(".training-card");
  await expect(cards).toHaveCount(10);
  const first = await cards.nth(0).boundingBox(),
    second = await cards.nth(1).boundingBox();
  expect(first!.y).toBe(second!.y);
  expect(second!.x).toBeGreaterThan(first!.x);
  const preview = cards.first().locator(".game-preview");
  await expect
    .poll(() =>
      preview
        .locator("img")
        .first()
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await preview
    .getByRole("button", { name: "Next screenshot of Flick Burst" })
    .click();
  await expect(preview).toHaveAttribute("data-slide", "1");
  await preview
    .getByRole("button", { name: "Show screenshot 1 of Flick Burst" })
    .click();
  await expect(preview).toHaveAttribute("data-slide", "0");
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileFirst = await cards.nth(0).boundingBox(),
    mobileSecond = await cards.nth(1).boundingBox();
  expect(mobileSecond!.y).toBeGreaterThan(mobileFirst!.y);
  expect(mobileFirst!.x).toBe(mobileSecond!.x);
  await preview.locator(".game-preview-track").evaluate((element) => {
    element.scrollLeft = element.clientWidth;
  });
  await expect(preview).toHaveAttribute("data-slide", "1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
async function startRound(page: Page) {
  await page.getByRole("button", { name: "Start round", exact: true }).click();
  await expect(page.locator(".arena-stage")).toHaveAttribute(
    "data-phase",
    "countdown",
  );
  await page.clock.runFor(3200);
  await expect(page.locator(".arena-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
}
async function targetPoint(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")!,
      data = ctx.getImageData(0, 0, canvas.width, canvas.height),
      rect = canvas.getBoundingClientRect();
    for (let y = 5; y < canvas.height - 5; y += 3)
      for (let x = 5; x < canvas.width - 5; x += 3) {
        const i = (y * canvas.width + x) * 4;
        if (
          data.data[i] > 160 &&
          data.data[i + 1] > 130 &&
          data.data[i + 1] < 180 &&
          data.data[i + 2] > 230
        )
          return {
            x: rect.left + (x / canvas.width) * rect.width,
            y: rect.top + ((y + 6) / canvas.height) * rect.height,
          };
      }
    throw new Error("No rendered target found");
  });
}
test("fresh profile has empty history and all ten scenarios", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A little practice. A better aim." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Training library", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Open scenario", exact: true }),
  ).toHaveCount(10);
  await page.goto("/dashboard/");
  await expect(
    page.getByText("Your story starts with a session."),
  ).toBeVisible();
  await page.goto("/history/");
  await expect(page.getByText("No sessions here yet.")).toBeVisible();
});
test("2D round measures hits, saves once, restores on refresh and opens charts", async ({
  page,
}) => {
  await openRound(page, "flick-burst");
  await startRound(page);
  for (let i = 0; i < 3; i++) {
    const p = await targetPoint(page);
    await page.mouse.click(p.x, p.y);
    await page.clock.runFor(100);
  }
  await page.clock.runFor(31000);
  await expect(
    page.getByRole("heading", { name: "Session complete." }),
  ).toBeVisible();
  const raw = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("aimforge:data:v2")!),
  );
  expect(raw.sessions).toHaveLength(1);
  expect(raw.sessions[0].metrics.hits).toBe(3);
  expect(raw.sessions[0].metrics.shots).toBe(3);
  expect(raw.sessions[0].score).toBe(300);
  await page.reload();
  await expect(page.getByText("Personal best", { exact: true })).toBeVisible();
  await page.goto("/dashboard/");
  await expect(
    page.getByRole("heading", { name: "Performance over time" }),
  ).toBeVisible();
  await page.goto("/history/");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("pause excludes time and makes result ineligible", async ({ page }) => {
  await openRound(page, "smooth-tracking");
  await startRound(page);
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const before = await page.locator(".arena-hud").innerText();
  await page.clock.runFor(60000);
  expect(await page.locator(".arena-hud").innerText()).toBe(before);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(34000);
  await expect(
    page.getByRole("heading", { name: "Session complete." }),
  ).toBeVisible();
  const s = await page.evaluate(
    () => JSON.parse(localStorage.getItem("aimforge:data:v2")!).sessions[0],
  );
  expect(s.eligible).toBe(false);
  expect(s.activeMs).toBeCloseTo(30000, 2);
  expect(s.metrics.exposureMs).toBeCloseTo(30000, 2);
  expect(s.metrics.onTargetMs).toBe(0);
  expect(s.score).toBe(0);
});
for (const id of ["micro-precision", "moving-clicks"])
  test(id + " is playable and produces real results", async ({ page }) => {
    await openRound(page, id);
    await startRound(page);
    const p = await targetPoint(page);
    await page.mouse.click(p.x, p.y);
    await page.clock.runFor(31000);
    await expect(
      page.getByRole("heading", { name: "Session complete." }),
    ).toBeVisible();
    const s = await page.evaluate(
      () => JSON.parse(localStorage.getItem("aimforge:data:v2")!).sessions[0],
    );
    expect(s.config.scenario).toBe(id);
    expect(s.metrics.shots).toBe(1);
  });
test("reaction false starts remain separate from click accuracy", async ({
  page,
}) => {
  await openRound(page, "reaction-tap");
  await startRound(page);
  const box = await page.locator("canvas").boundingBox();
  for (let i = 0; i < 10; i++) {
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.clock.runFor(600);
  }
  await expect(
    page.getByRole("heading", { name: "Session complete." }),
  ).toBeVisible();
  const s = await page.evaluate(
    () => JSON.parse(localStorage.getItem("aimforge:data:v2")!).sessions[0],
  );
  expect(s.metrics.falseStarts).toBe(10);
  expect(s.metrics.shots).toBe(0);
  expect(s.score).toBe(0);
});
test("pointer lock denial provides a usable 2D alternative", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = function () {
      document.dispatchEvent(new Event("pointerlockerror"));
      return Promise.reject(new Error("denied"));
    };
  });
  await openRound(page, "sphere-flick");
  await page.getByRole("button", { name: "Start round", exact: true }).click();
  await expect(
    page.getByText("Pointer capture was denied.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Try 2D practice" }),
  ).toBeVisible();
});
test("missing WebGL2 shows 2D fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/setup/sphere-flick/");
  await page.getByRole("button", { name: "Enter training" }).click();
  await expect(
    page.getByText("3D needs WebGL2", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Try 2D practice" }),
  ).toBeVisible();
});
for (const id of [
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
])
  test(
    id + " renders actual WebGL, captures input and finishes",
    async ({ page }) => {
      await openRound(page, id);
      await startRound(page);
      expect(
        await page.evaluate(
          () => document.pointerLockElement instanceof HTMLCanvasElement,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("canvas")
          .evaluate((c: HTMLCanvasElement) => !!c.getContext("webgl2")),
      ).toBe(true);
      await page.mouse.move(550, 330);
      await page.mouse.down();
      await page.clock.runFor(1000);
      await page.mouse.up();
      await page.clock.runFor(31000);
      await expect(
        page.getByRole("heading", { name: "Session complete." }),
      ).toBeVisible();
      const s = await page.evaluate(
        () => JSON.parse(localStorage.getItem("aimforge:data:v2")!).sessions[0],
      );
      expect(s.config.scenario).toBe(id);
      expect(s.activeMs).toBeCloseTo(30000, 2);
      expect(s.environment.fps).toBeGreaterThan(0);
    },
  );
test("locale, favorites and custom routines persist", async ({ page }) => {
  await page.goto("/training/");
  await page.getByRole("button", { name: "Favorite scenario" }).first().click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Favorite scenario" }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/routines/");
  await page.getByRole("button", { name: "Create routine" }).click();
  await page
    .getByRole("textbox", { name: "Routine name" })
    .fill("Evening focus");
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(
    page.getByRole("heading", { name: "Evening focus" }),
  ).toBeVisible();
  await page.goto("/settings/");
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "O‘zbekcha" }).click();
  await expect(
    page.getByRole("heading", { name: "Sozlamalar", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sozlamalar", exact: true }),
  ).toBeVisible();
});
test("invalid import preserves valid storage", async ({ page }) => {
  await page.goto("/settings/");
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  const before = await page.evaluate(() =>
    localStorage.getItem("aimforge:data:v2"),
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schema":999}'),
  });
  await expect(page.locator(".data-modal-error")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("aimforge:data:v2")),
  ).toBe(before);
});
test("mobile navigation and long localized labels do not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings/");
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Deutsch" }).click();
  await expect(
    page.getByRole("heading", { name: "Einstellungen", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/training/");
  await expect(page.locator(".library-grid article")).toHaveCount(10);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("prepared app loads and runs offline", async ({ page, context }) => {
  await page.goto("/settings/");
  await page
    .getByRole("button", { name: "Prepare both engines offline" })
    .click();
  await expect(
    page.getByText("Both engines are available offline."),
  ).toBeVisible({ timeout: 45000 });
  await page.reload();
  await context.setOffline(true);
  await page.goto("/training/");
  await expect(page.locator(".library-grid article")).toHaveCount(10);
  await openRound(page, "flick-burst");
  await startRound(page);
  await page.clock.runFor(31000);
  await expect(
    page.getByRole("heading", { name: "Session complete." }),
  ).toBeVisible();
  await page.goto("/setup/sphere-flick/");
  await page.getByRole("button", { name: "Enter training" }).click();
  await expect(
    page.getByRole("button", { name: "Start round", exact: true }),
  ).toBeVisible();
  await startRound(page);
  expect(
    await page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) => !!c.getContext("webgl2")),
  ).toBe(true);
  await context.setOffline(false);
});

test("one active training tab holds the lock until exit", async ({
  page,
  context,
}) => {
  await openRound(page, "flick-burst");
  await startRound(page);
  const second = await context.newPage();
  await second.goto("/setup/flick-burst/");
  await second.getByRole("button", { name: "Enter training" }).click();
  await second
    .getByRole("button", { name: "Start round", exact: true })
    .click();
  await expect(
    second.getByText("Training is already active in another tab.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await second
    .getByRole("button", { name: "Start round", exact: true })
    .click();
  await expect(second.locator(".arena-stage")).toHaveAttribute(
    "data-phase",
    "countdown",
  );
  await second.close();
});

test("unsupported raw input falls back to ordinary capture and context loss pauses", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.requestPointerLock;
    HTMLCanvasElement.prototype.requestPointerLock = function (
      this: HTMLCanvasElement,
      options?: PointerLockOptions,
    ) {
      if (options?.unadjustedMovement) {
        document.dispatchEvent(new Event("pointerlockerror"));
        return Promise.reject(new Error("unsupported"));
      }
      return original.call(this);
    };
  });
  await page.goto("/settings/");
  await page
    .getByRole("checkbox", {
      name: "Request unadjusted movement when supported",
    })
    .check();
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .first()
    .click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  await openRound(page, "sphere-flick");
  await startRound(page);
  expect(
    await page.evaluate(
      () => document.pointerLockElement instanceof HTMLCanvasElement,
    ),
  ).toBe(true);
  await page
    .locator("canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.locator(".arena-stage")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  await expect(
    page.getByText("The graphics context was lost.", { exact: false }),
  ).toBeVisible();
});
