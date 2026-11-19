import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { api } from "../api";
import LeaveManagement from "./LeaveManagement";

const session = vi.hoisted(() => ({
  user: { actions: ["leave.apply"], read_only_demo: false },
}));
vi.mock("../session", () => ({ useSession: () => session }));
vi.mock("../api", () => ({ api: vi.fn() }));
const balance = {
  user_id: "maya",
  display_name: "Arya Dhumal",
  as_of: "2026-11-19",
  balances: [
    { leave_type_id: "annual", name: "Annual leave", balance_days: 17 },
  ],
};
beforeEach(() => {
  session.user.actions = ["leave.apply"];
  session.user.read_only_demo = false;
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/leave/balance"
      ? balance
      : path === "/leave/team"
        ? { as_of: balance.as_of, items: [balance] }
        : path === "/leave/types"
          ? { items: [{ id: "annual", name: "Annual leave", active: true }] }
          : { items: [] },
  );
});
function show() {
  render(
    <MemoryRouter>
      <LeaveManagement />
    </MemoryRouter>,
  );
}

test("employee application remains local until confirmation and uses the API contract", async () => {
  show();
  await screen.findByText("17 days");
  await userEvent.selectOptions(screen.getByLabelText("Leave type"), "annual");
  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2026-12-01" },
  });
  fireEvent.change(screen.getByLabelText("End date"), {
    target: { value: "2026-12-03" },
  });
  await userEvent.type(screen.getByLabelText("Reason"), "Family travel plans");
  await userEvent.click(
    screen.getByRole("button", { name: "Review application" }),
  );
  expect(
    vi.mocked(api).mock.calls.filter(([, o]) => o?.method === "POST"),
  ).toHaveLength(0);
  await userEvent.click(
    screen.getByRole("button", { name: "Confirm" }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/leave/requests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          leave_type_id: "annual",
          start_date: "2026-12-01",
          end_date: "2026-12-03",
          reason: "Family travel plans",
        }),
      }),
    ),
  );
});

test.each(["leave.review", "leave.manage"])(
  "central role %s never requests a personal balance or application form",
  async (action) => {
    session.user.actions = ["leave.read_all", action];
    show();
    expect((await screen.findAllByText("Arya Dhumal"))[0]).toBeVisible();
    expect(screen.queryByRole("heading", { name: "My leave" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Apply for leave" }),
    ).toBeNull();
    expect(
      vi.mocked(api).mock.calls.some(([p]) => p === "/leave/balance"),
    ).toBe(false);
  },
);

test("read-only demo prevents leave submission", async () => {
  session.user.read_only_demo = true;
  show();
  expect(
    await screen.findByRole("button", {
      name: "Review application",
    }),
  ).toBeDisabled();
});

test("API failure has an accessible error state", async () => {
  vi.mocked(api).mockRejectedValue(new Error("Unable to load leave records"));
  show();
  expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
    "Unable to load leave records",
  );
});
