import type {
  LeaveBalance,
  LeaveEntryInput,
  ReportingRelationship,
} from "./types";

let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (method !== "GET") headers.set("X-CSRF-Token", csrf);
  const response = await fetch("/api/v1" + path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401)
      window.dispatchEvent(new Event("cortex:session-expired"));
    if (response.status === 409)
      window.dispatchEvent(new Event("cortex:evidence-changed"));
    throw new ApiError(
      response.status,
      data.error?.message || "The request could not be completed.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const leavePaths = {
  team: "/leave/team",
  ownBalance: (asOf: string) => "/leave/balance" + asOfQuery(asOf),
  employeeBalance: (userId: string, asOf: string) =>
    `/leave/employees/${encodeURIComponent(userId)}/balance` + asOfQuery(asOf),
};

function asOfQuery(asOf: string) {
  return asOf ? "?" + new URLSearchParams({ as_of: asOf }) : "";
}

export function createLeaveEntry(entry: LeaveEntryInput) {
  return api<LeaveBalance & { entry_id: string }>("/leave/ledger-entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export function setEmployeeManager(userId: string, managerUserId: string) {
  return api<ReportingRelationship>(
    `/admin/users/${encodeURIComponent(userId)}/manager`,
    {
      method: "PUT",
      body: JSON.stringify({ manager_user_id: managerUserId }),
    },
  );
}
