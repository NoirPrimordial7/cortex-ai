import { Badge, State, useResource } from "./components";
import type { PolicyIntegrity } from "./types";

export function PolicyProvenance({ versionId }: { versionId: string }) {
  const { data, error, loading, reload } = useResource<PolicyIntegrity>(
    `/versions/${versionId}/integrity`,
  );
  return (
    <details className="hash-details" open>
      <summary>Policy Integrity &amp; Provenance</summary>
      <State error={error} loading={loading}>
        {data && (
          <>
            <Badge state={data.status} />
            <dl className="provenance-list">
              <dt>Original upload</dt>
              <dd>
                {data.original_filename || "Historical filename unavailable"}
              </dd>
              <dt>Uploaded by</dt>
              <dd>
                {data.uploader_name ||
                  data.uploaded_by ||
                  "Historical uploader unknown"}
              </dd>
              <dt>Upload timestamp</dt>
              <dd>{data.uploaded_at}</dd>
              <dt>Version</dt>
              <dd>{data.version_label}</dd>
              <dt>Original SHA-256</dt>
              <dd>
                <code>{data.sha256}</code>
              </dd>
              <dt>Extracted text SHA-256</dt>
              <dd>
                <code>{data.extracted_sha256}</code>
              </dd>
              <dt>Signature</dt>
              <dd>{data.algorithm} · server verification</dd>
              <dt>Public key fingerprint</dt>
              <dd>
                <code>{data.key_id || "Unavailable"}</code>
              </dd>
              <dt>Last verification</dt>
              <dd>{data.last_verified_at}</dd>
              <dt>Provenance origin</dt>
              <dd>
                {data.origin === "verified_legacy_backfill"
                  ? "Verified historical hash backfill; original uploader is unknown"
                  : "Signed on upload"}
              </dd>
            </dl>
            <p className="section-note">
              {data.encryption}. Signatures verify content integrity and do not
              encrypt files.
            </p>
          </>
        )}
      </State>
      <button className="button" disabled={loading} onClick={reload}>
        Verify again
      </button>
    </details>
  );
}
