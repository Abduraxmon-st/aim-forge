import { it, expect } from "vitest";
import { num, decimal } from "./index";
it("caps display precision at three decimals without changing stored measurements", () => {
  const measured = 0.32938293829;
  expect(num(measured, 12)).toBe("0.329");
  expect(num(0.30000000004, 3)).toBe("0.3");
  expect(num(1.99999, 3)).toBe("2");
  expect(num(NaN, 3)).toBe("—");
  expect(decimal(measured)).toBe(0.329);
  expect(measured).toBe(0.32938293829);
});
