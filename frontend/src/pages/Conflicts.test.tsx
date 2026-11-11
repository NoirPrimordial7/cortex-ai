import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import Conflicts from "./Conflicts";
import { api, ApiError } from "../api";

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  api: vi.fn(),
}));

test("a revoked comparison source keeps the other passage out of the view", async () => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path.endsWith("/c1"))
      return { id: "c1", text: "Unshown comparison passage" };
    if (path.endsWith("/c2")) throw new ApiError(404, "Resource unavailable");
    return {
      items: [
        {
          query_id: "q",
          status: "abstained",
          reason_code: "UNRESOLVED_CONFLICT",
          answer: "The approved policies disagree.",
          as_of: "2026-10-10",
          scope: { population: "india_full_time", jurisdiction: "IN" },
          citations: [
            { id: "c1", title: "Remote policy A", clause_id: "clause-a" },
            { id: "c2", title: "Remote policy B", clause_id: "clause-b" },
          ],
        },
      ],
    };
  });
  render(
    <MemoryRouter>
      <Conflicts />
    </MemoryRouter>,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Compare policy evidence" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Resource unavailable",
  );
  expect(screen.queryByText("Unshown comparison passage")).toBeNull();
  expect(
    screen.queryByRole("navigation", { name: "Comparison sources" }),
  ).toBeNull();
});
