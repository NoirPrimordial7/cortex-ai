export type User = {
  id: string;
  display_name: string;
  workspace: string;
  roles: { id: string; name: string }[];
  actions: string[];
};
export type Citation = {
  id: string;
  document_id: string;
  version_id: string;
  clause_id: string;
  title: string;
  quote: string;
  locator: string;
  start_char: number;
  end_char: number;
  source_hash: string;
  valid_from: string;
  valid_to: string | null;
  source_kind: string;
  authority_rank?: number;
  reviewed_value: number;
};
export type Answer = {
  query_id: string;
  status: "answered" | "abstained" | "clarification_required";
  reason_code: string | null;
  mode: "evidence";
  as_of: string;
  scope: { population: string; jurisdiction: string };
  answer: string;
  citations: Citation[];
  created_at?: string;
};
export type Source = Citation & { text: string; query_id: string };
export type DocumentItem = {
  id: string;
  title: string;
  category: string;
  version_count: number;
  latest_ingested_at: string;
};
export type Version = {
  id: string;
  version_label: string;
  sha256: string;
  ingested_at: string;
  published_at: string | null;
  extraction_state: string;
  metadata_revision: number;
  approval_state: string | null;
  valid_from: string | null;
  valid_to: string | null;
  population: string | null;
  source_kind: string | null;
  topic: string | null;
};
export type Detail = { document: DocumentItem; versions: Version[] };
export type Content = {
  version_id: string;
  document_id: string;
  title: string;
  text: string;
  source_hash: string;
  segments: { start: number; end: number; locator: string }[];
  metadata_revision: number;
};
