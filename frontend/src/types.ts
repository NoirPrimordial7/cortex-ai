export type User = {
  id: string;
  display_name: string;
  workspace: string;
  roles: { id: string; name: string }[];
  actions: string[];
  read_only_demo?: boolean;
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
  source?: "leave_ledger";
  balances?: LeaveBalanceItem[];
  display_name?: string | null;
  related_results?: RelatedPassage[];
  follow_up?: boolean;
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
export type RelatedPassage = {
  clause_id: string;
  document_id: string;
  title: string;
  locator: string;
  excerpt: { text: string; matched: boolean }[];
};
export type Source = Citation & { text: string; query_id: string };
export type DocumentItem = {
  heading_name?: string | null;
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
  workflow_status: "draft" | "submitted" | "approved" | "rejected";
  workflow_revision: number;
  heading_id: string | null;
  heading_name: string | null;
  review_comment: string | null;
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
export type LeaveBalanceItem = {
  leave_type_id: string;
  code: string;
  name: string;
  annual_entitlement_days: number;
  balance_days: number;
};

export type LeaveBalance = {
  user_id: string;
  as_of: string;
  balances: LeaveBalanceItem[];
};

export type ReportBalance = LeaveBalance & { display_name: string };
export type LeaveTeam = { as_of: string; items: ReportBalance[] };

export type LeaveEntryInput = {
  user_id: string;
  leave_type_id: string;
  entry_type: "grant" | "accrual" | "usage" | "adjustment" | "carry_forward";
  days: number;
  effective_date: string;
  reference?: string | null;
};

export type LeaveRequest = {
  id: string;
  user_id: string;
  display_name: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "withdrawn"
    | "cancellation_pending"
    | "cancelled";
  revision: number;
  review_comment: string | null;
  history?: {
    status: string;
    comment: string;
    created_at: string;
    actor: string;
  }[];
};
export type PolicyTicket = {
  display_name?: string;
  id: string;
  description: string;
  status: "pending" | "resolved";
  revision: number;
  resolution?: string | null;
  selected_document_id?: string | null;
  policies?: { document_id: string; title: string; available: boolean }[];
  history?: {
    operation: string;
    reason: string;
    created_at: string;
    actor?: string;
  }[];
  attachments?: { id: string; filename: string; sha256: string }[];
};
export type PolicyIntegrity = {
  uploader_name?: string | null;
  status: "Verified" | "Integrity Mismatch" | "Unable to Verify";
  original_filename: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  version_label: string;
  sha256: string;
  extracted_sha256: string;
  algorithm: string;
  key_id: string | null;
  last_verified_at: string;
  encryption: string;
  origin: string | null;
};
