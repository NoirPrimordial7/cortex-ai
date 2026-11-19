import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { api } from "../api";
import DocumentDetail from "./DocumentDetail";
vi.mock("../session", () => ({
  useSession: () => ({
    user: {
      actions: ["query.execute", "ticket.create"],
      read_only_demo: false,
    },
  }),
}));
vi.mock("../api", () => ({ api: vi.fn() }));

test("a re-audit exact-version link opens the older cited edition instead of the latest upload", async () => {
  const base = {
    sha256: "hash",
    ingested_at: "2026-11-01",
    published_at: "2026-01-01",
    extraction_state: "indexed",
    metadata_revision: 1,
    approval_state: "approved",
    valid_from: "2026-01-01",
    valid_to: null,
    population: "india_full_time",
    source_kind: "operations_policy",
    topic: "remote_work",
    workflow_status: "approved",
    workflow_revision: 2,
    heading_id: "heading",
    heading_name: "Remote work",
    review_comment: "Reviewed",
  };
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/documents/policy")
      return {
        document: {
          id: "policy",
          title: "Remote work policy",
          category: "policy",
          version_count: 2,
          latest_ingested_at: "2026-11-01",
        },
        versions: [
          { ...base, id: "newer", version_label: "Newer edition" },
          { ...base, id: "cited", version_label: "Cited edition" },
        ],
      };
    if (path === "/versions/cited/content")
      return {
        version_id: "cited",
        document_id: "policy",
        title: "Remote work policy",
        text: "The exact cited policy edition.",
        source_hash: "hash",
        segments: [{ start: 0, end: 31, locator: "TXT line 1" }],
        metadata_revision: 1,
      };
    if (String(path).endsWith("/integrity"))
      return {
        status: "Verified",
        original_filename: "cited.txt",
        uploaded_at: "2026-01-01",
        version_label: "Cited edition",
        sha256: "hash",
        extracted_sha256: "hash",
        algorithm: "Ed25519",
        last_verified_at: "2026-11-20",
        encryption: "Local upload files are not encrypted at rest",
        origin: "upload",
      };
    return { history: [] };
  });
  render(
    <MemoryRouter initialEntries={["/documents/policy?version=cited"]}>
      <Routes>
        <Route path="/documents/:id" element={<DocumentDetail />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText("The exact cited policy edition."),
  ).toBeVisible();
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/versions/cited/content"),
  );
  expect(
    vi
      .mocked(api)
      .mock.calls.some(([path]) => path === "/versions/newer/content"),
  ).toBe(false);
});
