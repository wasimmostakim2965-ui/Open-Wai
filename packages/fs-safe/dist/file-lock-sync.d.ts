import { type SidecarLockStaleSnapshot } from "./sidecar-lock-reclaim.js";
import type { SidecarLockCommonAcquireOptions, SidecarLockOptionFields, SidecarLockReclaimParams } from "./sidecar-lock-types.js";
export type FileLockSyncAcquireOptions<TPayload extends Record<string, unknown>> = SidecarLockOptionFields<SidecarLockCommonAcquireOptions & {
    staleMs?: number;
    payload: () => TPayload;
    shouldReclaim?: (params: SidecarLockReclaimParams<false>) => boolean;
    shouldRemoveStaleLock?: (snapshot: SidecarLockStaleSnapshot) => boolean;
}>;
export type FileLockSyncHandle = {
    lockPath: string;
    normalizedTargetPath: string;
    verifyStillHeld(): boolean;
    release(): void;
    [Symbol.dispose](): void;
};
export declare function acquireFileLockSync<TPayload extends Record<string, unknown>>(targetPath: string, options: FileLockSyncAcquireOptions<TPayload>): FileLockSyncHandle;
export declare function withFileLockSync<T, TPayload extends Record<string, unknown>>(targetPath: string, options: FileLockSyncAcquireOptions<TPayload>, fn: () => T): T;
