import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";
import Team from "./Team";
test("the retired Team screen redirects to centralized Leave Management", async () => {
  render(
    <MemoryRouter initialEntries={["/team"]}>
      <Routes>
        <Route path="/team" element={<Team />} />
        <Route path="/leave" element={<h1>Leave Management</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("heading", { name: "Leave Management" }),
  ).toBeVisible();
});
