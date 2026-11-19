import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { ConflictReaudit } from "./ConflictReaudit";
import { api } from "./api";
import type { Answer } from "./types";
const session = vi.hoisted(() => ({
  user: { actions: ["ticket.create"], read_only_demo: false },
  refresh: vi.fn(async () => {}),
}));
vi.mock("./session", () => ({ useSession: () => session }));
vi.mock("./api", () => ({ api: vi.fn() }));
const answer = {
  query_id: "actual-conflict",
  reason_code: "UNRESOLVED_CONFLICT",
} as Answer;
beforeEach(() => {
  session.user.actions = ["ticket.create"];
  session.user.read_only_demo = false;
  vi.mocked(api).mockResolvedValue({ id: "case", status: "pending" });
});
test("one click posts only the actual query ID, with no employee input form", async () => {
  const done = vi.fn(async () => {});
  render(
    <ConflictReaudit answer={answer} disabled={false} onSubmitted={done} />,
  );
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "Send conflict for re-audit" }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(api).toHaveBeenCalledWith(
    "/policy-tickets",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ query_id: "actual-conflict" }),
    }),
  );
  expect(session.refresh).toHaveBeenCalled();
});
test("already subscribed pending conflicts cannot create duplicate submissions", () => {
  render(
    <ConflictReaudit
      answer={{
        ...answer,
        re_audit: {
          id: "case",
          status: "pending",
          resolution: null,
          revision: 0,
          selected_clause_id: null,
          subscribed: true,
        },
      }}
      disabled={false}
      onSubmitted={async () => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Already sent to Auditor" }),
  ).toBeDisabled();
});
test("shared demo blocks submission and Auditor has no Employee send action", () => {
  session.user.read_only_demo = true;
  const r = render(
    <ConflictReaudit
      answer={answer}
      disabled={false}
      onSubmitted={async () => {}}
    />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
  r.unmount();
  session.user.actions = ["ticket.review"];
  render(
    <ConflictReaudit
      answer={answer}
      disabled={false}
      onSubmitted={async () => {}}
    />,
  );
  expect(screen.queryByRole("button")).toBeNull();
});
test("failed submissions show an error without requesting free text", async () => {
  vi.mocked(api).mockRejectedValue(new Error("Sources changed; ask again"));
  render(
    <ConflictReaudit
      answer={answer}
      disabled={false}
      onSubmitted={async () => {}}
    />,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Sources changed; ask again",
  );
  expect(screen.queryByRole("textbox")).toBeNull();
});
