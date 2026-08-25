export type AdminFailureReason =
  | "unconfigured"
  | "unauthorized"
  | "timeout"
  | "unreachable"
  | "invalid_response";

export type AdminResult<T> =
  | { ok: true; data: T; at: string }
  | { ok: false; reason: AdminFailureReason };
