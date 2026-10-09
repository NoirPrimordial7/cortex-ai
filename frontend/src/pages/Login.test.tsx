import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import Login from "./Login";
import { api, ApiError } from "../api";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("../session", () => ({ useSession: () => ({ refresh }) }));
vi.mock("../api", async () => ({
  ...(await vi.importActual<typeof import("../api")>("../api")),
  api: vi.fn(),
}));
const profiles = [
  {
    key: "maya",
    label: "Maya · Employee",
    workspace: "NORTHSTAR",
    email: "maya@example.test",
    password: "fictional-test-only",
    active: true,
  },
  {
    key: "orbit",
    label: "Orbit · Other tenant",
    workspace: "ORBIT",
    email: "orbit@example.test",
    password: "other-test-only",
    active: true,
  },
  {
    key: "noor",
    label: "Noor · Disabled account",
    workspace: "NORTHSTAR",
    email: "noor@example.test",
    password: "disabled-test-only",
    active: false,
  },
];
test("unapproved preview origin explains the configuration error and links to the approved demo", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ items: profiles })
    .mockRejectedValueOnce(new ApiError(403, "Origin not permitted"));
  render(<Login />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Maya · Employee" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Enter your workspace" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This review address is not approved",
  );
  expect(
    screen.getByRole("link", { name: "Open approved published demo" }),
  ).toHaveAttribute("href", "https://cortex-ai-three-kappa.vercel.app/");
  expect(
    screen.queryByRole("button", { name: "Reload demo accounts" }),
  ).not.toBeInTheDocument();
});
test("picker fills all credentials and tenant, without bypassing normal sign-in", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ items: profiles })
    .mockResolvedValueOnce({});
  render(<Login />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Maya · Employee" }),
  );
  expect(screen.getByLabelText("Email")).toHaveValue("maya@example.test");
  expect(screen.getByLabelText("Password")).toHaveValue("fictional-test-only");
  await userEvent.click(
    screen.getByRole("button", { name: "Orbit · Other tenant" }),
  );
  expect(screen.getByLabelText("Workspace")).toHaveValue("ORBIT");
  expect(api).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Enter your workspace" }),
  );
  await waitFor(() => expect(refresh).toHaveBeenCalledWith(true));
  expect(api).toHaveBeenLastCalledWith("/auth/login", {
    method: "POST",
    signal: expect.any(AbortSignal),
    body: JSON.stringify({
      workspace: "ORBIT",
      email: "orbit@example.test",
      password: "other-test-only",
    }),
  });
});
test("disabled profile still uses real authentication and displays denial", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ items: profiles })
    .mockRejectedValueOnce(new Error("Invalid credentials"));
  render(<Login />);
  await userEvent.click(await screen.findByRole("button", { name: /Noor/ }));
  await userEvent.click(
    screen.getByRole("button", { name: "Enter your workspace" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Invalid credentials",
  );
});
test("cold backend shows an explicit profile retry, preserving manual login", async () => {
  vi.mocked(api)
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce({ items: profiles });
  render(<Login />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Load demo accounts" }),
  );
  expect(
    await screen.findByRole("button", { name: "Maya · Employee" }),
  ).toBeInTheDocument();
});

test("a failed post-login session check remains visible instead of silently leaving the login form", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ items: profiles })
    .mockResolvedValueOnce({});
  refresh.mockRejectedValueOnce(
    new Error("Sign-in could not establish a session. Please retry."),
  );
  render(<Login />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Maya · Employee" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Enter your workspace" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Sign-in could not establish a session",
  );
  expect(
    screen.getByRole("button", { name: "Reload demo accounts" }),
  ).toBeEnabled();
});
