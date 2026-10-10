import type { SidecarLockReclaimParams, SidecarLockRetryOptions } from "./sidecar-lock-types.js";
export declare function validateSidecarLockRetryOptions(retry: SidecarLockRetryOptions): void;
export declare function validateSidecarLockTimeoutMs(timeoutMs: number | undefined): void;
export declare function validateSidecarLockStaleMs(staleMs: number | undefined): void;
export declare function validateSidecarLockCompromiseCheckIntervalMs(intervalMs: number | undefined): void;
export declare function computeSidecarLockDelayMs(retry: SidecarLockRetryOptions, attempt: number): number;
export declare function sidecarLockTimeout(lockPath: string, normalizedTargetPath: string): Error;
export declare function sidecarLockStale(lockPath: string, normalizedTargetPath: string): Error;
/** Undefined means the deadline or retry count is exhausted. */
export declare function sidecarLockRetryDelay(retry: SidecarLockRetryOptions, timeoutMs: number | undefined, elapsed: number, attempt: number): number | undefined;
export declare const maxTransientLockDenials = 8;
export declare function isTransientLockFileDenial(error: unknown, lockPath: string): boolean;
export declare function sidecarLockPayloadCreatedAtMs(payload: unknown): number | null;
export declare function defaultSidecarLockShouldReclaim(params: Pick<SidecarLockReclaimParams, "lockPath" | "payload" | "staleMs" | "nowMs">): Promise<boolean>;
