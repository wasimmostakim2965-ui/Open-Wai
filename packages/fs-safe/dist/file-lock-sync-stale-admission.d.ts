import type { FileLockSyncAcquireOptions } from "./file-lock-sync.js";
import type { SyncLockAcquisition } from "./file-lock-sync-acquisition.js";
import type { SidecarLockStaleRecovery } from "./sidecar-lock-types.js";
export type SyncStaleOptionsState<TPayload extends Record<string, unknown>> = {
    shouldReclaimObserved?: boolean;
    shouldReclaim?: FileLockSyncAcquireOptions<TPayload>["shouldReclaim"];
    shouldRemoveObserved?: boolean;
    shouldRemove?: FileLockSyncAcquireOptions<TPayload>["shouldRemoveStaleLock"];
};
/** Handle one exclusive-create conflict without surrendering canonical admission. */
export declare function handleSyncStaleAdmission<TPayload extends Record<string, unknown>>(acquisition: SyncLockAcquisition, params: {
    currentHeld(): unknown;
    options: FileLockSyncAcquireOptions<TPayload>;
    parsePayload?: (raw: string) => unknown;
    reclaimGuardPath: string;
    staleMs: number;
    staleOptions: SyncStaleOptionsState<TPayload>;
    staleRecovery?: SidecarLockStaleRecovery;
}): void;
