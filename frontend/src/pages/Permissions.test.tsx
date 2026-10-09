import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { test, expect, vi, beforeEach } from "vitest";
import Permissions from "./Permissions";
import { api } from "../api";
const session = vi.hoisted(() => ({
  user: { id: "ravi", read_only_demo: false },
}));
vi.mock("../session", () => ({ useSession: () => session }));
vi.mock("../api", () => ({ api: vi.fn() }));
const directory = {
  items: [
    {
      id: "maya",
      display_name: "Maya Shah",
      email_normalized: "maya@example.test",
      active: true,
      role_ids: ["employee"],
    },
    {
      id: "ravi",
      display_name: "Ravi Mehta",
      email_normalized: "ravi@example.test",
      active: true,
      role_ids: ["admin"],
    },
  ],
  roles: [
    { id: "employee", name: "Employee" },
    { id: "admin", name: "Administrator" },
  ],
  policy_revision: 7,
};
beforeEach(() => {
  session.user.read_only_demo = false;
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/admin/users"
      ? directory
      : path === "/documents"
        ? { items: [{ id: "doc", title: "Leave policy" }] }
        : path === "/admin/documents/doc/acl"
          ? {
              grants: [{ role_id: "employee" }, { user_id: "ravi" }],
              policy_revision: 7,
            }
          : {},
  );
});
function show() {
  render(
    <MemoryRouter>
      <Permissions />
    </MemoryRouter>,
  );
}
test("account changes stay local until explicit confirmation and include expected revision", async () => {
  show();
  await userEvent.click(
    await screen.findByRole("button", { name: "Edit Maya Shah" }),
  );
  await userEvent.click(screen.getByLabelText("Account is active"));
  await userEvent.click(
    screen.getByRole("button", { name: "Review account changes" }),
  );
  expect(api).not.toHaveBeenCalledWith("/admin/users/maya", expect.anything());
  expect(screen.getByRole("dialog")).toHaveTextContent("Active → Disabled");
  await userEvent.click(
    screen.getByRole("button", { name: "Confirm access changes" }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/admin/users/maya", {
      method: "PATCH",
      body: JSON.stringify({
        active: false,
        role_ids: ["employee"],
        expected_policy_revision: 7,
      }),
    }),
  );
});
test("cancelled grant review does not submit an ACL update", async () => {
  show();
  await screen.findByText("Maya Shah");
  await userEvent.click(
    screen.getByRole("button", { name: "Document access" }),
  );
  await userEvent.selectOptions(
    screen.getByLabelText("Readable document"),
    "doc",
  );
  await screen.findByLabelText("Employee");
  await userEvent.click(screen.getByLabelText("Employee"));
  await userEvent.click(
    screen.getByRole("button", { name: "Review grant changes" }),
  );
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "Access removedEmployee",
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel changes" }));
  expect(api).not.toHaveBeenCalledWith(
    "/admin/documents/doc/acl",
    expect.objectContaining({ method: "PUT" }),
  );
});
test("shared demo permits inspecting roles while preventing role and account mutations", async () => {
  session.user.read_only_demo = true;
  show();
  await userEvent.click(
    await screen.findByRole("button", { name: "View roles for Maya Shah" }),
  );
  expect(screen.getByLabelText("Account is active")).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Review account changes" }),
  ).toBeNull();
});
