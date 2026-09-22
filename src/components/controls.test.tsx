import { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { afterEach, it, expect } from "vitest";
import "../i18n";
import { Select, DatePicker, RadioGroup } from "./controls";
afterEach(cleanup);
it("custom select keeps its label, supports keyboard selection, and cancels without changing value", () => {
  function Demo() {
    const [value, setValue] = useState("first");
    return (
      <label>
        Mode
        <Select
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <option value="first">First</option>
          <option value="disabled" disabled>
            Disabled
          </option>
          <option value="last">Last</option>
        </Select>
      </label>
    );
  }
  render(<Demo />);
  const combo = screen.getByRole("combobox", { name: "Mode" });
  fireEvent.keyDown(combo, { key: "ArrowDown" });
  fireEvent.keyDown(combo, { key: "ArrowDown" });
  fireEvent.keyDown(combo, { key: "Enter" });
  expect(combo).toHaveTextContent("Last");
  fireEvent.click(combo);
  fireEvent.keyDown(combo, { key: "Home" });
  fireEvent.keyDown(combo, { key: "Escape" });
  expect(combo).toHaveTextContent("Last");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.keyDown(combo, { key: "f" });
  fireEvent.keyDown(combo, { key: "Enter" });
  expect(combo).toHaveTextContent("First");
});
it("calendar selects across a month boundary, restores focus, and clears the filter", async () => {
  function Demo() {
    const [value, setValue] = useState("2026-01-31");
    return (
      <DatePicker
        aria-label="From date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  }
  render(<Demo />);
  const trigger = screen.getByRole("button", { name: "From date" });
  fireEvent.click(trigger);
  const selected = screen.getByRole("button", {
    name: "Saturday, January 31, 2026",
  });
  fireEvent.keyDown(selected, { key: "ArrowRight" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Sunday, February 1, 2026" }),
    ).toHaveFocus(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Sunday, February 1, 2026" }),
  );
  expect(trigger).toHaveTextContent("Feb 1, 2026");
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(trigger).toHaveTextContent("From date");
});
it("custom radio choices retain native checked semantics", () => {
  function Demo() {
    const [value, setValue] = useState("30");
    return (
      <RadioGroup
        label="Duration"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "30", label: "30 s" },
          { value: "60", label: "60 s" },
        ]}
      />
    );
  }
  render(<Demo />);
  fireEvent.click(screen.getByRole("radio", { name: "60 s" }));
  expect(screen.getByRole("radio", { name: "60 s" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "30 s" })).not.toBeChecked();
});
