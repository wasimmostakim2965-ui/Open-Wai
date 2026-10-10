import type { FileLockSyncAcquireOptions } from "./file-lock-sync.js";
import type { SidecarLockRetryOptions } from "./sidecar-lock-types.js";
type CapturedRootSyncAcquireOptions<TPayload extends Record<string, unknown>> = Readonly<Pick<FileLockSyncAcquireOptions<TPayload>, "compromiseCheckIntervalMs" | "lockPath" | "onCompromised" | "parsePayload" | "payload" | "reentrantOwner" | "staleRecovery" | "timeoutMs"> & {
    optionsReceiver: FileLockSyncAcquireOptions<TPayload>;
    retry: Readonly<SidecarLockRetryOptions>;
    shouldReclaim?: FileLockSyncAcquireOptions<TPayload>["shouldReclaim"];
    shouldRemoveStaleLock?: FileLockSyncAcquireOptions<TPayload>["shouldRemoveStaleLock"];
    staleMs: number;
}>;
export declare function captureRootSyncAcquireOptions<TPayload extends Record<string, unknown>>(options: FileLockSyncAcquireOptions<TPayload>): CapturedRootSyncAcquireOptions<TPayload>;
export {};
