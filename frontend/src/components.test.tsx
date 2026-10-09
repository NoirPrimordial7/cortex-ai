import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { SourceDialog } from "./components";

test("source dialog traps keyboard focus and closes with Escape", async () => {
  const close = vi.fn();
  render(
    <SourceDialog onClose={close}>
      <button>Close source</button>
      <button>Inspect version</button>
    </SourceDialog>,
  );
  expect(screen.getByRole("button", { name: "Close source" })).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Inspect version" })).toHaveFocus();
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Close source" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledOnce();
});
