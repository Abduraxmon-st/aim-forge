import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import "../../i18n";
import Library from "./Library";
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
it("exposes ten working scenario links and a real filter", () => {
  render(<Library />);
  expect(screen.getAllByRole("link", { name: /Open scenario/i })).toHaveLength(
    10,
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Dimension" }), {
    target: { value: "3d" },
  });
  expect(screen.getAllByRole("link", { name: /Open scenario/i })).toHaveLength(
    5,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Search scenarios" }), {
    target: { value: "nothing matches" },
  });
  expect(
    screen.queryAllByRole("link", { name: /Open scenario/i }),
  ).toHaveLength(0);
  expect(screen.getByText("No matching scenarios.")).toBeInTheDocument();
});
