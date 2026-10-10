export type FsSafeErrorCode = (typeof OPERATIONAL_CODE_VALUES)[number] | "already-exists" | "denied-path" | "device-path" | "hardlink" | "invalid-path" | "insecure-permissions" | "not-file" | "not-owned" | "outside-workspace" | "path-alias" | "path-mismatch" | "secret-exists" | "store-reentrant-update" | "symlink" | "too-large";
export type FsSafeErrorCategory = "policy" | "operational";
export type FsSafeErrorDetails = Readonly<Record<string, unknown>>;
declare const OPERATIONAL_CODE_VALUES: readonly ["helper-failed", "helper-unavailable", "not-empty", "not-found", "not-removable", "permission-unverified", "read-failed", "timeout", "unsupported-platform"];
export declare function categorizeFsSafeError(code: FsSafeErrorCode): FsSafeErrorCategory;
export declare class FsSafeError extends Error {
    readonly code: FsSafeErrorCode;
    readonly category: FsSafeErrorCategory;
    readonly details?: FsSafeErrorDetails;
    constructor(code: FsSafeErrorCode, message: string, options?: {
        cause?: unknown;
        details?: FsSafeErrorDetails;
    });
}
export {};
