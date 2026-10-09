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
  const [search, setSearch] = useState("");
  const { user } = useSession();
  const { data, error, loading } = useResource<{ items: DocumentItem[] }>(
    "/documents",
  );
  const items =
    data?.items.filter((d) =>
      d.title.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        eyebrow="YOUR KNOWLEDGE COLLECTION"
        title="Document library"
        description="A clear view of the documents you can read."
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
          <span className="subtle">{items.length} visible documents</span>
        </div>
        <State error={error} loading={loading}>
          {items.length === 0 ? (
            <div className="empty-state">
              <FileTextIcon size={32} />
              <h2>No documents to show</h2>
              <p>
                Try a different search or ask your administrator about access.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Versions</th>
                    <th>Latest upload</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link
                          className="document-link"
                          to={"/documents/" + d.id}
                        >
                          <FileTextIcon size={23} weight="light" />
                          <span>
                            <strong>{d.title}</strong>
                            <small>{d.id}</small>
                          </span>
                        </Link>
                      </td>
                      <td>{d.category}</td>
                      <td>{d.version_count}</td>
                      <td>{d.latest_ingested_at?.slice(0, 10)}</td>
                      <td>
                        <Link
                          className="icon-button"
                          aria-label={"Open " + d.title}
                          to={"/documents/" + d.id}
                        >
                          <ArrowUpRightIcon size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </State>
        <footer className="table-footer">
          Upload date describes when a file arrived. Open its versions to
          inspect approval and effective validity.
        </footer>
      </section>
    </>
  );
}
