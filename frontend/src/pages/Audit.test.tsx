import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import Audit from "./Audit";
import { api } from "../api";

vi.mock("../api", () => ({ api: vi.fn() }));

test("audit filters combine and can reveal a sanitized leave access request ID", async () => {
  vi.mocked(api).mockResolvedValue({
    items: [
      {
        created_at: "2026-11-12T07:00:00Z",
        action: "leave.team.read",
        outcome: "success",
        request_id: "leave-request",
      },
      {
        created_at: "2026-11-12T06:00:00Z",
        action: "query.execute",
        outcome: "answered",
        request_id: "query-request",
      },
    ],
  });
  render(<Audit />);
  expect(await screen.findByText("leave · team · read")).toBeVisible();
  await userEvent.selectOptions(
    screen.getByLabelText("Action"),
    "leave.team.read",
  );
  expect(screen.queryByText("query · execute")).toBeNull();
  await userEvent.click(screen.getByText("Request ID"));
  expect(screen.getByText("leave-request")).toBeVisible();
  await userEvent.selectOptions(screen.getByLabelText("Outcome"), "answered");
  expect(
    screen.getByRole("heading", { name: "No events to show" }),
  ).toBeVisible();
  expect(screen.queryByText("leave-request")).toBeNull();
});
