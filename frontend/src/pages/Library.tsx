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
      <section className="catalogue">
        <aside className="catalogue-index">
          <h2>Your collection</h2>
          <p className="catalogue-total">
            {data?.items.length ?? "—"}
            <span>permitted documents</span>
          </p>
          <p className="section-note">
            An upload is a source record. Approval and effective dates are
            reviewed inside each edition.
          </p>
          <nav aria-label="Document categories">
            {["all", ...new Set(data?.items.map((d) => d.category))].map(
              (c) => (
                <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === "all" ? "All documents" : c}
                  <span>
                    {
                      data?.items.filter((d) => c === "all" || d.category === c)
                        .length
                    }
                  </span>
                </button>
              ),
            )}
          </nav>
        </aside>
        <div className="catalogue-content">
          <div className="library-toolbar">
            <label className="search-field">
              <MagnifyingGlassIcon size={18} />
              <span className="sr-only">Search documents</span>
              <input
                name="document-search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a document…"
              />
            </label>
            <label>
              <span className="sr-only">Category</span>
              <select
                name="category"
                aria-label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All types</option>
                {[...new Set(data?.items.map((d) => d.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort documents</span>
              <select
                name="sort"
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
              <div className="catalogue-records">
                {items.map((d) => (
                  <Link
                    key={d.id}
                    className="catalogue-record"
                    to={"/documents/" + d.id}
                    aria-label={"Open " + d.title}
                  >
                    <FileTextIcon size={25} />
                    <div>
                      <span className="record-category">{d.category}</span>
                      <h2>{d.title}</h2>
                      <p>
                        {d.version_count}{" "}
                        {d.version_count === 1 ? "version" : "versions"}
                        <span>
                          Latest upload{" "}
                          {d.latest_ingested_at?.slice(0, 10) || "unavailable"}
                        </span>
                      </p>
                    </div>
                    <ArrowUpRightIcon size={22} />
                  </Link>
                ))}
              </div>
            )}
          </State>
          <footer className="table-footer">
            Showing {items.length} of {data?.items.length ?? 0} documents{" "}
            {(search || category !== "all") && (
              <button
                className="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </button>
            )}
          </footer>
        </div>
      </section>
    </>
  );
}
