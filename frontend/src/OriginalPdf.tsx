import { useEffect, useRef, useState } from "react";
/** Raster-only original pages. Every request rechecks READ on the server. */
export default function OriginalPdf({
  versionId,
  onDenied,
}: {
  versionId: string;
  onDenied: () => void;
}) {
  const [page, setPage] = useState(1),
    [count, setCount] = useState(1),
    [image, setImage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const denied = useRef(onDenied);
  const [zoom, setZoom] = useState(false);
  denied.current = onDenied;
  useEffect(() => {
    const abort = new AbortController();
    let object = "";
    setImage("");
    setError("");
    setBusy(true);
    fetch(`/api/v1/versions/${versionId}/pages/${page}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if ([401, 403, 404, 409].includes(response.status)) {
            denied.current();
            window.dispatchEvent(new Event("cortex:evidence-changed"));
          }
          throw new Error(
            "Original PDF page unavailable. Use extracted text or download.",
          );
        }
        const blob = await response.blob();
        if (abort.signal.aborted) return;
        object = URL.createObjectURL(blob);
        setImage(object);
        setCount(Number(response.headers.get("X-PDF-Page-Count")) || 1);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => {
      abort.abort();
      if (object) URL.revokeObjectURL(object);
    };
  }, [page, versionId]);
  return (
    <section className="original-pdf">
      <nav aria-label="Original PDF pages">
        <button
          className="button"
          disabled={busy || page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous original page
        </button>
        <span>
          Original PDF page {page} of {count}
        </span>
        <button
          className="button"
          disabled={busy || page === count}
          onClick={() => setPage(page + 1)}
        >
          Next original page
        </button>
      </nav>
      <p className="section-note">
        Original page raster. Exact evidence highlighting is available in
        extracted text; no position overlay is inferred.
      </p>
      {busy && (
        <p role="status">Checking access and rendering original page…</p>
      )}
      {error && <p role="alert">{error}</p>}
      {image && (
        <>
          <button className="button" onClick={() => setZoom(!zoom)}>
            {zoom ? "Fit original page" : "Enlarge original page"}
          </button>
          <div className={"original-raster" + (zoom ? " is-enlarged" : "")}>
            <img src={image} alt={`Original PDF page ${page}`} />
          </div>
        </>
      )}
    </section>
  );
}
