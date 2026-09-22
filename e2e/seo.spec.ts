import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const supportedLocales = ["en", "es", "de", "ru", "uz"] as const;
type Locale = (typeof supportedLocales)[number];
const dictionary = (locale: Locale): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`../src/i18n/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
const es = dictionary("es");
const headings = {
  en: {
    howTo: "How to play",
    scoring: "How scoring works",
    help: "Understand your practice. Control your data.",
  },
  es: {
    howTo: "Cómo jugar",
    scoring: "Cómo se puntúa",
    help: "Entiende tu práctica. Controla tus datos.",
  },
  de: {
    howTo: "So wird gespielt",
    scoring: "So funktioniert die Wertung",
    help: "Verstehe dein Training. Behalte deine Daten.",
  },
  ru: {
    howTo: "Как играть",
    scoring: "Подсчёт очков",
    help: "Понимайте тренировку. Управляйте данными.",
  },
  uz: {
    howTo: "Qanday o‘ynaladi",
    scoring: "Ball qanday hisoblanadi",
    help: "Mashqni tushuning. Ma’lumotni boshqaring.",
  },
};

test.describe("translated public content is readable without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of supportedLocales) {
    test(`${locale} guide and help are present in the initial HTML`, async ({
      page,
    }) => {
      const strings = dictionary(locale),
        copy = headings[locale];
      const response = await page.goto(`/${locale}/games/flick-burst/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        strings["flick-burst"],
      );
      await expect(
        page.getByRole("heading", { name: copy.howTo, exact: true }),
      ).toBeVisible();
      expect(await page.locator("main ol li").count()).toBeGreaterThanOrEqual(
        3,
      );
      await expect(
        page.getByRole("heading", { name: copy.scoring, exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('a[href="/' + locale + '/setup/flick-burst/"]').first(),
      ).toBeVisible();
      const screenshots = page.locator(
        '.game-preview img[src^="/training/flick-burst-"]',
      );
      await expect(screenshots).toHaveCount(2);
      await expect(screenshots.first()).toHaveAttribute("alt", /\S+/);
      expect(
        await screenshots
          .first()
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      ).toBe(true);
      await expect(
        page.locator('script[type="application/ld+json"]'),
      ).toHaveCount(1);

      await page.goto(`/${locale}/help/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        copy.help,
      );
      await expect(
        page.getByRole("heading", {
          name: strings["help-controls"],
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(strings["help-controlsBody"], { exact: true }),
      ).toBeVisible();
    });
  }
});

test("language links keep the current game and lead to translated HTML", async ({
  page,
}) => {
  await page.goto("/en/games/flick-burst/");
  for (const locale of supportedLocales) {
    await expect(
      page.locator(
        `a[hreflang="${locale}"][href="/${locale}/games/flick-burst/"]`,
      ),
    ).toHaveCount(1);
  }
  await page.locator('a[hreflang="de"][href="/de/games/flick-burst/"]').click();
  await expect(page).toHaveURL(/\/de\/games\/flick-burst\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    dictionary("de")["flick-burst"],
  );
});

test("a translated guide keeps its language through setup, a full round, and results", async ({
  page,
}) => {
  // Begin with a persisted English preference to verify that the explicit URL wins.
  await page.goto("/settings/");
  await expect(
    page.getByRole("combobox", { name: "Language", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("aimforge:data:v2")!).settings.language,
    ),
  ).toBe("en");
  await page.clock.install();
  await page.goto("/es/games/flick-burst/");
  await page.locator('a[href="/es/setup/flick-burst/"]').first().click();
  await expect(page).toHaveURL(/\/es\/setup\/flick-burst\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.getByRole("button", { name: es["Enter training"], exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "30 s", exact: true }).click();
  await page
    .getByRole("button", { name: es["Enter training"], exact: true })
    .click();
  await expect(page).toHaveURL(/\/es\/arena\/\?config=/);
  await page
    .getByRole("button", { name: es["Start round"], exact: true })
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
  await page.clock.runFor(31000);
  await expect(page).toHaveURL(/\/es\/results\/\?/);
  await expect(
    page.getByRole("heading", { name: es["Session complete."], exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("aimforge:data:v2")!),
  );
  expect(saved.settings.language).toBe("es");
  expect(saved.sessions).toHaveLength(1);
  expect(saved.sessions[0].config.scenario).toBe("flick-burst");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.getByRole("heading", { name: es["Session complete."], exact: true }),
  ).toBeVisible();
});

test("translated library has game links and filtering does not scroll on first open", async ({
  page,
}) => {
  await page.goto("/es/training/");
  await expect(page.locator(".training-card")).toHaveCount(10);
  await expect(
    page.locator('.training-card h3 a[href="/es/games/flick-burst/"]'),
  ).toHaveText(es["flick-burst"]);
  const dimension = page.getByRole("combobox", {
    name: es.Dimension,
    exact: true,
  });
  await dimension.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await dimension.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThan(2);
  await page.getByRole("option", { name: "3D", exact: true }).click();
  await expect(page.locator(".training-card")).toHaveCount(5);
  await expect(
    page.locator('.training-card h3 a[href="/es/games/sphere-flick/"]'),
  ).toBeVisible();
  await page
    .locator('.training-card h3 a[href="/es/games/sphere-flick/"]')
    .click();
  await expect(page).toHaveURL(/\/es\/games\/sphere-flick\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    es["sphere-flick"],
  );
});

test("changing language in localized settings navigates and preserves saved profile edits", async ({
  page,
}) => {
  const de = dictionary("de"),
    nickname = "My saved training profile";
  await page.goto("/es/settings/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page
    .getByRole("textbox", { name: es["Nickname (optional)"], exact: true })
    .fill(nickname);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("aimforge:data:v2")!).settings
            .nickname,
      ),
    )
    .toBe(nickname);
  await page.getByRole("combobox", { name: es.Language, exact: true }).click();
  await page.getByRole("option", { name: "Deutsch", exact: true }).click();
  await expect(page).toHaveURL(/\/de\/settings\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(de.Settings);
  await expect(
    page.getByRole("combobox", { name: de.Language, exact: true }),
  ).toHaveText("Deutsch");
  await expect(
    page.getByRole("textbox", { name: de["Nickname (optional)"], exact: true }),
  ).toHaveValue(nickname);
  await page.reload();
  await expect(page).toHaveURL(/\/de\/settings\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("combobox", { name: de.Language, exact: true }),
  ).toHaveText("Deutsch");
  await expect(
    page.getByRole("textbox", { name: de["Nickname (optional)"], exact: true }),
  ).toHaveValue(nickname);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("aimforge:data:v2")!).settings,
  );
  expect(saved.language).toBe("de");
  expect(saved.nickname).toBe(nickname);
});

test("game guide and screenshot carousel fit a narrow mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/de/games/target-switching/");
  const preview = page.locator(".game-preview").first();
  await expect(preview).toBeVisible();
  await preview.locator(".gallery-arrow.next").click();
  await expect(preview).toHaveAttribute("data-slide", "1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bounds = await preview.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});

for (const route of ["/ru/training/", "/training/"]) {
  test(`static library prefetch has no missing assets at ${route}`, async ({
    page,
  }) => {
    const failures: string[] = [],
      pageErrors: string[] = [],
      segments = new Set<string>();
    page.on("response", (response) => {
      const url = decodeURIComponent(response.url());
      if (response.status() >= 400)
        failures.push(`${response.status()} ${url}`);
      if (url.includes("__next.") && url.includes("__PAGE__.txt"))
        segments.add(url);
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(route);
    const cards = page.locator(".training-card");
    await expect(cards).toHaveCount(10);
    // Every card exposes both a guide link and a setup link. Scrolling makes
    // Next prefetch their exported route segments, including deep route groups.
    for (let index = 0; index < 10; index++) {
      for (const selector of ["h3 a", "a.card-footer"]) {
        const link = cards.nth(index).locator(selector);
        const destination = new URL(
          (await link.getAttribute("href"))!,
          page.url(),
        ).pathname;
        await link.scrollIntoViewIfNeeded();
        await expect
          .poll(
            () =>
              [...segments].some((url) =>
                new URL(url).pathname.startsWith(destination + "__next."),
              ),
            {
              message: `Expected a completed page-segment prefetch for ${destination}`,
            },
          )
          .toBe(true);
      }
    }
    expect(failures, "All prefetched static assets must exist").toEqual([]);

    const destination = route.startsWith("/ru/")
      ? "/ru/games/target-switching/"
      : "/setup/target-switching/";
    const link = cards
      .last()
      .locator(route.startsWith("/ru/") ? "h3 a" : "a.card-footer");
    await link.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(destination);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      dictionary(route.startsWith("/ru/") ? "ru" : "en")["target-switching"],
    );
    expect(
      failures,
      "Navigation must also load without missing assets",
    ).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
