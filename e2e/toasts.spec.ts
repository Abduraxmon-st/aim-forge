import { test, expect, type Page } from "@playwright/test";
import { freshSnapshot } from "../src/domain/models";
import { session } from "../src/test/fixtures";

const key = "aimforge:data:v2";
const toasts = (page: Page) => page.locator(".aimforge-toast");

test("settings edits coalesce into one saved toast, keep focus, and do not replay on reload", async ({
  page,
}) => {
  await page.goto("/en/settings/");
  const nickname = page.getByRole("textbox", {
    name: "Nickname (optional)",
    exact: true,
  });
  await expect(nickname).toBeVisible();
  await expect(toasts(page)).toHaveCount(0);
  await nickname.pressSequentially("Toast tester", { delay: 35 });
  await expect(toasts(page).filter({ hasText: "Settings saved." })).toHaveCount(
    1,
  );
  await expect(toasts(page)).toHaveCount(1);
  await expect(nickname).toBeFocused();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).settings.nickname,
      key,
    ),
  ).toBe("Toast tester");
  await page.reload();
  await expect(nickname).toHaveValue("Toast tester");
  await expect(toasts(page)).toHaveCount(0);
  const save = page.getByRole("button", { name: "Save settings", exact: true });
  await save.click();
  await expect(toasts(page)).toContainText("Settings saved.");
  await expect(save).toBeFocused();
  await page.keyboard.press("Alt+t");
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-sonner-toast]")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    toasts(page).getByRole("button", { name: "Dismiss notification" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toasts(page)).toHaveCount(0);
});

test("toast lifetime pauses while hovered and dismisses after the pointer leaves", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/settings/");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  const notice = toasts(page).filter({ hasText: "Settings saved." });
  await expect(notice).toBeVisible();
  await notice.hover();
  await page.clock.runFor(6000);
  await expect(notice).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.runFor(5000);
  await expect(notice).toHaveCount(0);
});

test("a failed settings save shows an error, never a success, and preserves the stored profile", async ({
  page,
}) => {
  await page.goto("/settings/");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)" }),
  ).toBeVisible();
  const before = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("full", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, key);
  await page
    .getByRole("textbox", { name: "Nickname (optional)" })
    .fill("Cannot save");
  await expect(
    page.locator('.aimforge-toast[data-kind="error"]'),
  ).toBeVisible();
  await expect(
    page.locator('.aimforge-toast[data-kind="success"]'),
  ).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    before,
  );
});

test("canceling a data dialog is silent; a confirmed download shows one success toast", async ({
  page,
}) => {
  await page.goto("/settings/");
  await page
    .getByRole("button", { name: "Export JSON backup", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(toasts(page)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Export JSON backup", exact: true })
    .click();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Download file", exact: true })
    .click();
  await downloading;
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(toasts(page)).toHaveCount(1);
  await expect(toasts(page)).toContainText("Download started.");
  await expect(toasts(page)).toContainText("Export JSON backup");
});

test("a modal error toast is visible in the top layer on mobile and dismissal keeps the validation explanation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/en/settings/");
  await page
    .getByRole("button", { name: "Import backup", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schema":999}'),
  });
  const error = dialog.locator('.aimforge-toast[data-kind="error"]');
  await expect(error).toBeVisible();
  await expect
    .poll(() =>
      error.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          e.contains(
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
          )
        );
      }),
    )
    .toBe(true);
  await error.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(error).toHaveCount(0);
  await expect(dialog.locator(".data-modal-error")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Confirm replacement" }),
  ).toBeDisabled();
});

test("favorite and routine saves use reusable success feedback", async ({
  page,
}) => {
  await page.goto("/en/training/");
  const favorite = page
    .locator(".training-card")
    .filter({
      has: page.getByRole("heading", { name: "Flick Burst", exact: true }),
    })
    .getByRole("button", { name: "Favorite scenario" });
  await favorite.click();
  await expect(toasts(page)).toContainText("Added to favorites");
  await favorite.click();
  await expect(toasts(page)).toContainText("Removed from favorites");
  await page.goto("/en/routines/");
  await page
    .getByRole("button", { name: "Create routine", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Routine name" })
    .fill("Toast routine");
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await expect(toasts(page)).toContainText("Routine created");
  const routine = page.locator(".routine-card").filter({
    has: page.getByRole("heading", { name: "Toast routine", exact: true }),
  });
  page.once("dialog", (dialog) => dialog.accept());
  await routine.getByRole("button", { name: "Delete routine" }).click();
  await expect(toasts(page)).toContainText("Routine deleted");
  await expect(routine).toHaveCount(0);
});

test("copy and result-image actions report success or clipboard fallback without losing selectable text", async ({
  page,
}) => {
  const profile = freshSnapshot();
  const result = session();
  profile.sessions = [result];
  await page.addInitScript(
    ({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)),
    { key, profile },
  );
  await page.goto("/results/?id=" + result.id);
  await page.getByRole("button", { name: "Share result", exact: true }).click();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => {} },
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Copy text", exact: true }).click();
  await expect(toasts(page)).toContainText("Copied.");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Copy text", exact: true }).click();
  await expect(toasts(page)).toContainText("Copy the text below.");
  await expect(page.getByRole("textbox", { name: "Share text" })).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click();
  expect((await downloading).suggestedFilename()).toBe("aimforge-result.png");
  await expect(toasts(page)).toContainText("Download started.");
});

test("German toast content fits a narrow screen and honors the saved reduced-motion preference", async ({
  page,
}) => {
  const profile = freshSnapshot();
  profile.settings.language = "de";
  profile.settings.reducedMotion = true;
  await page.addInitScript(
    ({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)),
    { key, profile },
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/de/settings/");
  await page
    .getByRole("button", { name: "Einstellungen speichern", exact: true })
    .click();
  await expect(toasts(page)).toHaveAttribute("data-kind", "success");
  expect(
    await toasts(page).evaluate((e) => {
      const r = e.getBoundingClientRect();
      return (
        r.left >= 0 && r.right <= innerWidth && e.scrollWidth <= e.clientWidth
      );
    }),
  ).toBe(true);
  expect(
    await page
      .locator("[data-sonner-toast]")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
  expect(await toasts(page).innerText()).not.toContain("Settings saved.");
});
