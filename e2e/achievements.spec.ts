import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { achievementCatalog } from "../src/domain/achievements";
import {
  emptyMetrics,
  freshSnapshot,
  type Snapshot,
} from "../src/domain/models";
import { session } from "../src/test/fixtures";

const dictionary = (locale: "en" | "de"): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`../src/i18n/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
const en = dictionary("en");
const secretIds = achievementCatalog
  .filter((entry) => entry.secret)
  .map((entry) => entry.id);
const storageKey = "aimforge:data:v2";

async function seedProfile(page: Page, snapshot: unknown) {
  // Every test owns an isolated browser context; never replace a real user's profile.
  await page.addInitScript(
    ({ key, profile }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(profile));
    },
    { key: storageKey, profile: snapshot },
  );
}

async function expectNoSecretSpoilers(page: Page, except?: string) {
  const visibleText = await page.locator("main").innerText();
  for (const id of secretIds) {
    if (id === except) continue;
    expect(visibleText).not.toContain(en["achievement-" + id]);
    expect(visibleText).not.toContain(en["requirement-" + id]);
  }
}

test("a fresh collection has 25 real milestones, five masked secrets, and working filters", async ({
  page,
}) => {
  await page.goto("/achievements/");
  const cards = page.locator(".achievement-card");
  const progress = page.getByRole("progressbar", {
    name: en["achievements-progress-label"],
    exact: true,
  });
  await expect(cards).toHaveCount(25);
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "25");
  await expect(
    page.locator(".achievement-card.is-secret.is-locked"),
  ).toHaveCount(5);
  await expect(page.locator(".achievement-card.is-earned")).toHaveCount(0);
  await expectNoSecretSpoilers(page);

  const filters = page.getByRole("group", {
    name: en["achievements-filter-label"],
    exact: true,
  });
  const categories = page.getByRole("group", {
    name: en["achievements-category-label"],
    exact: true,
  });
  await filters.getByRole("button", { name: /^Unlocked/ }).click();
  await expect(cards).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: en["achievements-empty-title"],
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(en["achievements-empty-body"], { exact: true }),
  ).toBeVisible();
  await filters.getByRole("button", { name: /^In progress/ }).click();
  await expect(cards).toHaveCount(20);
  await expect(
    cards.locator(".achievement-progress[role=progressbar]"),
  ).toHaveCount(20);
  await categories.getByRole("button", { name: /^Practice/ }).click();
  await expect(cards).toHaveCount(7);
  await filters.getByRole("button", { name: /^Secrets/ }).click();
  await expect(cards).toHaveCount(5);
  await expect(cards.locator("h2")).toHaveText(
    Array(5).fill(en["achievements-secret-name"]),
  );
  await expect(cards.locator("[role=progressbar]")).toHaveCount(0);
  await expectNoSecretSpoilers(page);
  await filters.getByRole("button", { name: /^All/ }).click();
  await expect(cards).toHaveCount(25);
});

test("secret details stay masked and the keyboard modal restores focus", async ({
  page,
}) => {
  await page.goto("/achievements/");
  const opener = page
    .getByRole("button", {
      name: en["achievements-view"] + ": " + en["achievements-secret-name"],
      exact: true,
    })
    .first();
  await opener.focus();
  await opener.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: en["achievements-secret-name"],
      exact: true,
    }),
  ).toBeVisible();
  for (const id of secretIds) {
    await expect(dialog).not.toContainText(en["achievement-" + id]);
    await expect(dialog).not.toContainText(en["requirement-" + id]);
  }
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("Tab");
    const focus = await dialog.evaluate((element) => ({
      insideDialog: element.contains(document.activeElement),
      // Native dialogs permit browser chrome in the tab sequence. Background
      // page controls must stay inert; browser chrome is not a focus escape.
      browserChrome:
        !document.hasFocus() && document.activeElement === document.body,
    }));
    expect(focus.insideDialog || focus.browserChrome).toBe(true);
  }
  await page
    .locator(".achievement-filters button")
    .first()
    .evaluate((element: HTMLElement) => element.focus());
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.press("Enter");
  await page
    .getByRole("button", { name: en["achievements-detail-close"], exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("a completed real round unlocks the first milestone and survives a refresh", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/setup/flick-burst/");
  await page.getByRole("radio", { name: "30 s", exact: true }).click();
  await page
    .getByRole("button", { name: "Enter training", exact: true })
    .click();
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
  await page.clock.runFor(31000);
  await expect(
    page.getByRole("heading", { name: "Session complete.", exact: true }),
  ).toBeVisible();
  const notice = page.getByRole("complementary", {
    name: en["achievements-celebration"],
    exact: true,
  });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("status")).toContainText(
    en["achievement-first"],
  );
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    storageKey,
  );
  expect(saved.sessions).toHaveLength(1);
  expect(saved.achievements).toContain("first");

  await page.goto("/achievements/");
  const first = page.locator(".achievement-card").filter({
    has: page.getByRole("heading", {
      name: en["achievement-first"],
      exact: true,
    }),
  });
  await expect(first).toHaveClass(/is-earned/);
  await expect(first.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await expect(
    page.getByRole("progressbar", {
      name: en["achievements-progress-label"],
      exact: true,
    }),
  ).toHaveAttribute("aria-valuenow", "1");
  await page.reload();
  await expect(first).toHaveClass(/is-earned/);
  await expect(
    page.locator(".achievement-card.is-secret.is-locked"),
  ).toHaveCount(5);
});

test("a compatible older profile reveals only its earned secret and keeps it after saving", async ({
  page,
}) => {
  const profile: Partial<Snapshot> = freshSnapshot();
  delete profile.achievementStats;
  profile.sessions = [
    session({
      metrics: {
        ...emptyMetrics(),
        hits: 30,
        shots: 30,
        bestCombo: 30,
        combo: 30,
      },
    }),
  ];
  await seedProfile(page, profile);
  await page.goto("/achievements/");
  const ghost = page.locator(".achievement-card").filter({
    has: page.getByRole("heading", {
      name: en["achievement-ghost"],
      exact: true,
    }),
  });
  await expect(ghost).toHaveClass(/is-earned/);
  await expect(
    page.locator(".achievement-card.is-secret.is-locked"),
  ).toHaveCount(4);
  await expectNoSecretSpoilers(page, "ghost");
  await ghost
    .getByRole("button", {
      name: en["achievements-view"] + ": " + en["achievement-ghost"],
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(en["requirement-ghost"]);
  await page.keyboard.press("Escape");

  await page.goto("/settings/");
  await page
    .getByRole("textbox", { name: "Nickname (optional)", exact: true })
    .fill("Restored achievement profile");
  await expect(page.locator(".settings-save-state")).toHaveText(
    "Saved on this device",
  );
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).achievements,
      storageKey,
    ),
  ).toContain("ghost");
  await page.goto("/achievements/");
  await page.reload();
  await expect(ghost).toHaveClass(/is-earned/);
  await expect(
    page.locator(".achievement-card.is-secret.is-locked"),
  ).toHaveCount(4);
});

test("all 25 previously earned achievements restore without exceeding the old profile limit", async ({
  page,
}) => {
  const profile = freshSnapshot();
  profile.achievements = achievementCatalog.map((entry) => entry.id);
  await seedProfile(page, profile);
  await page.goto("/achievements/");
  await expect(page.locator(".achievement-card.is-earned")).toHaveCount(25);
  await expect(
    page.locator(".achievement-card.is-secret.is-locked"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("progressbar", {
      name: en["achievements-progress-label"],
      exact: true,
    }),
  ).toHaveAttribute("aria-valuenow", "25");
  for (const id of secretIds)
    await expect(
      page
        .locator(".achievement-card")
        .getByRole("heading", { name: en["achievement-" + id], exact: true }),
    ).toBeVisible();
  await page.reload();
  await expect(page.locator(".achievement-card.is-earned")).toHaveCount(25);
});

test("German achievements and their detail dialog fit a narrow mobile screen", async ({
  page,
}) => {
  const de = dictionary("de");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/de/achievements/");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("heading", { name: de.Achievements, level: 1, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".achievement-card")).toHaveCount(25);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", {
      name: de["achievements-view"] + ": " + de["achievements-secret-name"],
      exact: true,
    })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", {
      name: de["achievements-secret-name"],
      exact: true,
    }),
  ).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await dialog
    .getByRole("button", { name: de["achievements-detail-close"], exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
});

test("achievement cards respond to their container and German filters fit a 320px screen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/achievements/");
  const container = page.locator(".achievements-page");
  const cards = page.locator(".achievement-card");
  await expect(cards).toHaveCount(25);
  await container.evaluate((element: HTMLElement) => {
    element.style.width = "620px";
    element.style.maxWidth = "100%";
  });
  const first = await cards.nth(0).boundingBox(),
    second = await cards.nth(1).boundingBox(),
    third = await cards.nth(2).boundingBox();
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  expect(second!.x).toBeGreaterThan(first!.x);
  expect(third!.y).toBeGreaterThan(first!.y);
  expect(
    await container.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);

  await container.evaluate((element: HTMLElement) => {
    element.style.width = "280px";
  });
  const narrowFirst = await cards.nth(0).boundingBox(),
    narrowSecond = await cards.nth(1).boundingBox();
  expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y);
  expect(Math.abs(narrowSecond!.x - narrowFirst!.x)).toBeLessThan(2);
  expect(
    await container.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/de/achievements/");
  await expect(cards).toHaveCount(25);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const filters = page.getByRole("group", {
    name: dictionary("de")["achievements-filter-label"],
    exact: true,
  });
  const buttons = await filters.getByRole("button").all();
  const rows = new Set<number>();
  for (const button of buttons) {
    const bounds = await button.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    rows.add(Math.round(bounds!.y));
  }
  expect(rows.size).toBeGreaterThan(1);
});

for (const preference of ["browser", "saved setting"] as const)
  test(`achievement icon motion respects the ${preference} reduced-motion preference`, async ({
    page,
  }) => {
    if (preference === "browser")
      await page.emulateMedia({ reducedMotion: "reduce" });
    else {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const profile = freshSnapshot();
      profile.settings.reducedMotion = true;
      await seedProfile(page, profile);
    }
    await page.goto("/achievements/");
    await expect(page.locator(".achievement-card")).toHaveCount(25);
    const emblems = page.locator(".achievement-emblem, .achievement-emblem *");
    expect(await emblems.count()).toBeGreaterThanOrEqual(25);
    const animations = await emblems.evaluateAll((elements) =>
      elements.flatMap((element) => [
        getComputedStyle(element).animationName,
        getComputedStyle(element, "::before").animationName,
        getComputedStyle(element, "::after").animationName,
      ]),
    );
    expect(animations.every((name) => name === "none")).toBe(true);
  });
