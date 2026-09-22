import { it, expect } from "vitest";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
it("all five languages have complete, nonempty key sets with matching interpolation variables", () => {
  for (const locale of [es, de, ru, uz]) {
    expect(Object.keys(locale).sort()).toEqual(Object.keys(en).sort());
    for (const [key, text] of Object.entries(en)) {
      const translated = (locale as Record<string, string>)[key];
      expect(translated.trim()).not.toBe("");
      expect(translated.match(/\{\{\w+\}\}/g)?.sort() ?? []).toEqual(
        text.match(/\{\{\w+\}\}/g)?.sort() ?? [],
      );
    }
  }
});
