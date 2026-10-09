import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import { FilePicker } from "./FilePicker";
test("selected source shows filename and rejects an unsupported extension before submitting", async () => {
  render(<FilePicker />);
  const input = screen.getByLabelText("Source file") as HTMLInputElement;
  await userEvent.upload(
    input,
    new File(["text"], "policy.exe", { type: "application/octet-stream" }),
    { applyAccept: false },
  );
  expect(screen.getByText("policy.exe")).toBeVisible();
  expect(input.validity.valid).toBe(false);
  await userEvent.upload(
    input,
    new File(["text"], "policy.txt", { type: "text/plain" }),
  );
  expect(input.validity.customError).toBe(false);
  expect(screen.getByText("policy.txt")).toBeVisible();
});
