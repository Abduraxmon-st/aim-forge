import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  defaultSettings,
  freshSnapshot,
  type Snapshot,
} from "../src/domain/models";
import { allTotals, rebuild } from "../src/domain/rules";
import { session } from "../src/test/fixtures";

const storageKey = "aimforge:data:v2";
const recoveryKey = "aimforge:recovery:v2";
const dictionary = (locale: "de" | "es"): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`../src/i18n/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
const actions = [
  "Export JSON backup",
  "Export CSV",
  "Import backup",
  "Compact older details",
  "Clear training history",
  "Reset all data",
  "Export recovery data",
] as const;

function profileWithHistory(count = 1) {
  const profile = freshSnapshot();
  profile.settings.nickname = "Original profile";
  profile.settings.palette = "cyan";
  profile.favorites = ["micro-precision"];
  profile.routines.push({
    id: "my-focus",
    name: "My focus routine",
    steps: [{ scenario: "micro-precision", duration: 60, rounds: 2, rest: 10 }],
  });
  profile.sessions = Array.from({ length: count }, (_, index) =>
    session({
      startedAt: new Date(
        Date.parse("2026-09-21T08:00:00.000Z") + index * 120000,
      ).toISOString(),
    }),
  );
  return rebuild(profile);
}

async function seedProfile(page: Page, profile: Snapshot, recovery?: Snapshot) {
  // Playwright supplies a disposable browser context for each test.
  await page.addInitScript(
    ({ profile, recovery, storageKey, recoveryKey }) => {
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(profile));
        if (recovery)
          localStorage.setItem(recoveryKey, JSON.stringify(recovery));
      }
    },
    { profile, recovery, storageKey, recoveryKey },
  );
}

async function rawProfile(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), storageKey);
}

async function savedProfile(page: Page): Promise<Snapshot> {
  return JSON.parse((await rawProfile(page))!);
}

async function openDialog(page: Page, name: (typeof actions)[number]) {
  await page.getByRole("button", { name, exact: true }).click();
  const dialog = page.getByRole("dialog", { name, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("all seven data actions use custom dialogs and cancel or Escape preserves data and focus", async ({
  page,
}) => {
  await seedProfile(page, profileWithHistory());
  const nativeDialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    nativeDialogs.push(dialog.type());
    await dialog.dismiss();
  });
  await page.goto("/settings/");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Original profile");
  const before = await rawProfile(page);
  for (const [index, action] of actions.entries()) {
    const trigger = page.getByRole("button", { name: action, exact: true });
    const dialog = await openDialog(page, action);
    if (index % 2)
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await rawProfile(page)).toBe(before);
  }
  expect(nativeDialogs).toEqual([]);
});

test("JSON, CSV, and recovery dialogs download the correct local data", async ({
  page,
}) => {
  const profile = profileWithHistory();
  const recovery = freshSnapshot();
  recovery.settings.nickname = "Earlier recovery";
  await seedProfile(page, profile, recovery);
  await page.goto("/settings/");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Original profile");
  const before = await rawProfile(page);
  for (const action of [
    "Export JSON backup",
    "Export CSV",
    "Export recovery data",
  ] as const) {
    const dialog = await openDialog(page, action);
    const downloading = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Download file", exact: true })
      .click();
    const download = await downloading;
    expect(await download.failure()).toBeNull();
    const content = readFileSync((await download.path())!, "utf8");
    if (action === "Export CSV") {
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
      const rows = content.trim().split(/\r?\n/);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toContain("started_utc,training_date,timezone,scenario");
      expect(rows[1]).toContain('"flick-burst"');
    } else {
      expect(download.suggestedFilename()).toMatch(/\.json$/);
      const downloaded = JSON.parse(content);
      expect(downloaded.schema).toBe(2);
      expect(downloaded.settings.nickname).toBe(
        action === "Export recovery data"
          ? "Earlier recovery"
          : "Original profile",
      );
      expect(downloaded.sessions).toHaveLength(
        action === "Export recovery data" ? 0 : 1,
      );
    }
    if (await dialog.isVisible())
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  }
  expect(await rawProfile(page)).toBe(before);
});

test("import validates and previews before replacement and retains a recovery copy", async ({
  page,
}) => {
  await seedProfile(page, profileWithHistory());
  await page.goto("/settings/");
  const incoming = profileWithHistory(2);
  incoming.settings.nickname = "Imported profile";
  incoming.favorites = ["reaction-tap"];
  const file = {
    name: "my-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  };
  const before = await rawProfile(page);
  let dialog = await openDialog(page, "Import backup");
  await expect(
    dialog.getByRole("button", { name: "Confirm replacement", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Choose JSON file", exact: true }),
  ).toBeVisible();
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(
    dialog
      .locator(".data-file-picker")
      .getByText("Backup validated", { exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("my-backup.json");
  await expect(dialog).toContainText("Imported profile");
  await expect(
    dialog.getByRole("button", { name: "Confirm replacement", exact: true }),
  ).toBeEnabled();
  expect(await rawProfile(page)).toBe(before);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await rawProfile(page)).toBe(before);

  dialog = await openDialog(page, "Import backup");
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(
    dialog
      .locator(".data-file-picker")
      .getByText("Backup validated", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Confirm replacement", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Imported profile");
  const saved = await savedProfile(page);
  expect(saved.sessions).toHaveLength(2);
  expect(saved.favorites).toEqual(["reaction-tap"]);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), recoveryKey),
  ).toBe(before);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Imported profile");
});

test("compacting older details retains the most recent 100 sessions and all historical totals", async ({
  page,
}) => {
  const profile = profileWithHistory(125);
  await seedProfile(page, profile);
  await page.goto("/settings/");
  const dialog = await openDialog(page, "Compact older details");
  expect((await savedProfile(page)).sessions).toHaveLength(125);
  await dialog
    .getByRole("button", { name: "Compact older details", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const compacted = await savedProfile(page);
  expect(compacted.sessions).toHaveLength(100);
  expect(compacted.sessions[0].id).toBe(profile.sessions[25].id);
  expect(allTotals(compacted)).toEqual(allTotals(profile));
  expect(compacted.achievements).toEqual(
    expect.arrayContaining(profile.achievements),
  );
  expect(
    Object.values(compacted.archiveDays).reduce(
      (count, totals) => count + totals.sessions,
      0,
    ),
  ).toBe(25);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Original profile");
  expect((await savedProfile(page)).sessions).toHaveLength(100);
});

test("clearing history resets statistics and achievements while preserving settings, favorites, and routines", async ({
  page,
}) => {
  const profile = profileWithHistory();
  await seedProfile(page, profile);
  await page.goto("/settings/");
  const before = await rawProfile(page);
  const dialog = await openDialog(page, "Clear training history");
  await dialog
    .getByRole("button", { name: "Clear training history", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const cleared = await savedProfile(page);
  expect(cleared.sessions).toEqual([]);
  expect(cleared.achievements).toEqual([]);
  expect(cleared.records).toEqual({});
  expect(allTotals(cleared)).toEqual(allTotals(freshSnapshot()));
  expect(cleared.settings).toEqual(profile.settings);
  expect(cleared.favorites).toEqual(profile.favorites);
  expect(cleared.routines).toEqual(profile.routines);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), recoveryKey),
  ).toBe(before);
  await page.goto("/achievements/");
  await expect(page.locator(".achievement-card.is-earned")).toHaveCount(0);
});

test("resetting all data restores the default profile and preserves the previous profile for recovery", async ({
  page,
}) => {
  await seedProfile(page, profileWithHistory());
  await page.goto("/settings/");
  const before = await rawProfile(page);
  const dialog = await openDialog(page, "Reset all data");
  await dialog
    .getByRole("button", { name: "Reset all data", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("");
  const reset = await savedProfile(page);
  expect(reset.settings).toEqual(defaultSettings());
  expect(reset.sessions).toEqual([]);
  expect(reset.achievements).toEqual([]);
  expect(reset.favorites).toEqual([]);
  expect(reset.routines).toEqual(freshSnapshot().routines);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), recoveryKey),
  ).toBe(before);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("");
});

test("a failed storage write keeps the confirmation dialog open and preserves current data", async ({
  page,
}) => {
  await seedProfile(page, profileWithHistory());
  await page.goto("/settings/");
  const dialog = await openDialog(page, "Clear training history");
  const before = await rawProfile(page);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string) {
      if (name === key)
        throw new DOMException("Storage full", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, storageKey);
  await dialog
    .getByRole("button", { name: "Clear training history", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".data-modal-error")).toBeVisible();
  await expect(dialog.locator(".data-modal-error")).toContainText(/\S+/);
  await expect(
    dialog.locator('.aimforge-toast[data-kind="error"]'),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Clear training history", exact: true }),
  ).toBeEnabled();
  expect(await rawProfile(page)).toBe(before);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Original profile");
});

test("resetting a German profile navigates to English settings and retains the German recovery profile", async ({
  page,
}) => {
  const de = dictionary("de");
  const profile = profileWithHistory();
  profile.settings.language = "de";
  profile.settings.nickname = "Deutsches Trainingsprofil";
  await seedProfile(page, profile);
  await page.goto("/de/settings/");
  await expect(
    page.getByRole("textbox", { name: de["Nickname (optional)"], exact: true }),
  ).toHaveValue(profile.settings.nickname);
  const before = await rawProfile(page);
  await page
    .getByRole("button", { name: de["Reset all data"], exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: de["Reset all data"],
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: de["Reset all data"], exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/settings\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.locator('.aimforge-toast[data-kind="success"]'),
  ).toContainText("Local data reset.");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("");
  expect((await savedProfile(page)).settings).toEqual(defaultSettings());
  const recovery = await page.evaluate(
    (key) => localStorage.getItem(key),
    recoveryKey,
  );
  expect(recovery).toBe(before);
  expect(JSON.parse(recovery!).settings).toMatchObject({
    language: "de",
    nickname: profile.settings.nickname,
  });
});

test("importing a Spanish profile changes the localized settings URL and preserves the English profile for recovery", async ({
  page,
}) => {
  const es = dictionary("es");
  await seedProfile(page, profileWithHistory());
  await page.goto("/en/settings/");
  await expect(
    page.getByRole("textbox", { name: "Nickname (optional)", exact: true }),
  ).toHaveValue("Original profile");
  const before = await rawProfile(page);
  const incoming = profileWithHistory(2);
  incoming.settings.language = "es";
  incoming.settings.nickname = "Perfil importado";
  const dialog = await openDialog(page, "Import backup");
  await page.locator("input[type=file]").setInputFiles({
    name: "spanish-profile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await expect(
    dialog
      .locator(".data-file-picker")
      .getByText("Backup validated", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Confirm replacement", exact: true })
    .click();
  await expect(page).toHaveURL(/\/es\/settings\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.locator('.aimforge-toast[data-kind="success"]'),
  ).toContainText(es["Backup restored."]);
  await expect(
    page.getByRole("textbox", { name: es["Nickname (optional)"], exact: true }),
  ).toHaveValue("Perfil importado");
  const restored = await savedProfile(page);
  expect(restored.settings.language).toBe("es");
  expect(restored.sessions).toHaveLength(2);
  const recovery = await page.evaluate(
    (key) => localStorage.getItem(key),
    recoveryKey,
  );
  expect(recovery).toBe(before);
  expect(JSON.parse(recovery!).settings).toMatchObject({
    language: "en",
    nickname: "Original profile",
  });
});
