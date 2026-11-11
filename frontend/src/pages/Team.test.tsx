import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import Team from "./Team";

const report = {
  user_id: "maya",
  display_name: "Maya Shah",
  as_of: "2026-11-12",
  balances: [
    {
      leave_type_id: "annual",
      name: "Annual leave",
      balance_days: 17,
    },
  ],
};

function show(path = "/team") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/team" element={<Team />} />
        <Route path="/team/:userId" element={<Team />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("direct reports link to reauthorized details and support an as-of date", async () => {
  const request = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) =>
      Response.json(
        path === "/api/v1/leave/team"
          ? { as_of: report.as_of, items: [report] }
          : String(path).includes("?as_of=")
            ? {
                ...report,
                as_of: "2026-08-31",
                balances: [{ ...report.balances[0], balance_days: 20 }],
              }
            : report,
      ),
    );
  show();
  const table = await screen.findByRole("table", {
    name: "Direct report leave balances",
  });
  expect(within(table).getByText("17 days")).toBeVisible();
  await userEvent.click(within(table).getByRole("link", { name: "Maya Shah" }));
  expect(
    await screen.findByRole("heading", { name: "Maya Shah" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Balance date"), {
    target: { value: "2026-08-31" },
  });
  expect(await screen.findByText("20 days")).toBeVisible();
  expect(request).toHaveBeenCalledWith(
    "/api/v1/leave/employees/maya/balance?as_of=2026-08-31",
    expect.objectContaining({ credentials: "same-origin" }),
  );
});

test("empty team shows a clear state without exposing any report links", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ as_of: report.as_of, items: [] }),
  );
  show();
  expect(
    await screen.findByText("You have no current direct reports."),
  ).toBeVisible();
  expect(screen.queryByRole("table")).toBeNull();
});

test("a denied direct link exposes no employee name or balance", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(
      { error: { message: "Resource unavailable" } },
      { status: 404 },
    ),
  );
  show("/team/maya");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Resource unavailable",
  );
  expect(screen.queryByText("Maya Shah")).toBeNull();
  expect(screen.getByRole("link", { name: "Back to team" })).toBeVisible();
});
