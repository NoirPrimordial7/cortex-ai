import { ResponsiveTable } from "../FormPrimitives";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { PageHeading, State, useResource } from "../components";
import { useSession } from "../session";
import type { DocumentItem } from "../types";
export default function Library() {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [sort, setSort] = useState("title");
  const { user } = useSession();
  const { data, error, loading } = useResource<{ items: DocumentItem[] }>(
    "/documents",
  );
  const items = (
    data?.items.filter(
      (d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) &&
        (category === "all" || d.category === category),
    ) || []
  ).sort((a, b) =>
    sort === "recent"
      ? b.latest_ingested_at.localeCompare(a.latest_ingested_at)
      : a.title.localeCompare(b.title),
  );
  return (
    <>
      <PageHeading
        eyebrow="Collection"
        title="Document library"
        description="Browse your permitted sources. Open a document to check approval, versions and effective dates."
        action={
          user?.actions.includes("document.upload") ? (
            <Link className="button primary" to="/upload">
              <PlusIcon size={18} />
              Upload document
            </Link>
          ) : undefined
        }
      />
      <section className="library">
        <div className="library-toolbar">
          <label className="search-field">
            <MagnifyingGlassIcon size={18} />
            <span className="sr-only">Search documents</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a document…"
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {[...new Set(data?.items.map((d) => d.category))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort documents</span>
            <select
              aria-label="Sort documents"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="title">Title A–Z</option>
              <option value="recent">Latest upload</option>
            </select>
          </label>
        </div>
        <State error={error} loading={loading}>
          {!items.length ? (
            <div className="empty-state">
              <FileTextIcon size={32} />
              <h2>
                {search || category !== "all"
                  ? "No matching documents"
                  : "No documents available"}
              </h2>
              <p>
                {search || category !== "all"
                  ? "Try another title or category."
                  : "Ask your administrator about document access."}
              </p>
            </div>
          ) : (
            <ResponsiveTable
              className="document-table"
              caption="Documents available under your current access grants"
            >
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Versions</th>
                  <th>Latest upload</th>
                  <th>
                    <span className="sr-only">Open document</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link className="document-link" to={"/documents/" + d.id}>
                        <FileTextIcon size={24} />
                        <strong>{d.title}</strong>
                      </Link>
                    </td>
                    <td data-label="Category">
                      {d.category === "policy"
                        ? "Policy"
                        : d.category === "project"
                          ? "Project"
                          : d.category}
                    </td>
                    <td data-label="Versions">
                      {d.version_count}
                      <span className="mobile-only">
                        {" "}
                        {d.version_count === 1 ? "version" : "versions"}
                      </span>
                    </td>
                    <td data-label="Uploaded">
                      {d.latest_ingested_at?.slice(0, 10) || "Unavailable"}
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        to={"/documents/" + d.id}
                        aria-label={"Open " + d.title}
                      >
                        <ArrowUpRightIcon size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          )}
        </State>
        <footer className="table-footer">
          {items.length} {items.length === 1 ? "document" : "documents"} ·
          Upload dates describe file arrival; reviewed validity is shown inside
          each document.
        </footer>
      </section>
    </>
  );
}
