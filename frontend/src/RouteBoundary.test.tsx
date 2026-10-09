import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RouteBoundary } from "./RouteBoundary";

afterEach(() => vi.restoreAllMocks());
it("keeps a recoverable view without exposing a failed chunk's error details", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function FailedRoute(): never {
    throw new Error("private evidence in a failure message");
  }
  render(
    <RouteBoundary>
      <FailedRoute />
    </RouteBoundary>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This view could not load.",
  );
  expect(
    screen.getByRole("button", { name: "Reload workspace" }),
  ).toBeEnabled();
  expect(screen.queryByText(/private evidence/)).not.toBeInTheDocument();
});
