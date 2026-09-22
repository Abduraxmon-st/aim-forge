import { describe, expect, it } from "vitest";
import { scenarioIds } from "../domain/models";
import { getGameCopy, getSeoCopy, supportedLocales } from "./content";

describe("localized public content", () => {
  it("provides useful distinct guides and metadata for every game in each language", () => {
    for (const locale of supportedLocales) {
      const games = scenarioIds.map((id) => getGameCopy(locale, id));
      expect(new Set(games.map((game) => game.title)).size).toBe(10);
      expect(new Set(games.map((game) => game.description)).size).toBe(10);
      expect(new Set(games.map((game) => game.intro)).size).toBe(10);
      for (const game of games) {
        expect(game.name.length).toBeGreaterThan(3);
        expect(game.description.length).toBeGreaterThan(85);
        expect(game.intro.length).toBeGreaterThan(170);
        expect(game.howTo).toHaveLength(3);
        expect(game.tips).toHaveLength(2);
        expect(game.faq).toHaveLength(2);
        for (const text of [
          ...game.howTo,
          ...game.tips,
          game.controls,
          game.scoring,
          game.requirements,
          ...game.faq.map(({ answer }) => answer),
        ]) {
          expect(text.length).toBeGreaterThan(40);
          expect(text).not.toMatch(/undefined|\{\{\w+\}\}/);
        }
      }
    }
  });

  it("supplies localized public navigation, page metadata and real help topics", () => {
    for (const locale of supportedLocales) {
      const copy = getSeoCopy(locale);
      for (const page of [copy.home, copy.training, copy.help]) {
        expect(page.title.length).toBeGreaterThan(20);
        expect(page.description.length).toBeGreaterThan(90);
        expect(page.intro.length).toBeGreaterThan(100);
      }
      expect(copy.home.features).toHaveLength(3);
      expect(copy.help.sections).toHaveLength(9);
      expect(
        copy.help.sections.find(({ id }) => id === "privacy")?.body.length,
      ).toBeGreaterThan(100);
      for (const value of Object.values(copy.labels))
        expect(value.trim()).not.toBe("");
      if (locale !== "en") {
        expect(copy.training.intro).not.toBe(getSeoCopy("en").training.intro);
        for (const id of scenarioIds) {
          const game = getGameCopy(locale, id);
          const original = getGameCopy("en", id);
          expect(game.intro).not.toBe(original.intro);
          expect(game.controls).not.toBe(original.controls);
          expect(game.scoring).not.toBe(original.scoring);
          expect(game.faq[0].answer).not.toBe(original.faq[0].answer);
        }
      }
    }
  });

  it("explains the implemented input and scoring differences without claiming verified ranks", () => {
    expect(getGameCopy("en", "target-switching").intro).toContain(
      "three separate hits",
    );
    expect(getGameCopy("en", "target-switching").controls).toContain("Escape");
    expect(getGameCopy("en", "smooth-tracking").controls).toContain("Hold");
    expect(getGameCopy("en", "smooth-tracking").scoring).toContain(
      "all active target exposure",
    );
    expect(getGameCopy("en", "reaction-tap").intro).toContain("1.5 seconds");
    expect(getGameCopy("en", "reaction-tap").scoring).toContain("median");
    expect(getGameCopy("en", "flick-burst").scoring).toContain("25");
    expect(getGameCopy("en", "sphere-flick").requirements).toContain("WebGL2");
    expect(getSeoCopy("en").help.intro).toContain("not verified");
  });
});
