import type { SidecarLockSnapshot } from "./sidecar-lock-reclaim.js";
export type SyncHeldLock = {
    fd: number | undefined;
    lockPath: string;
    normalizedTargetPath: string;
    parsePayload?: (raw: string) => unknown;
    refCount: number;
    reentrantOwner?: string;
    snapshot: SidecarLockSnapshot;
    timer?: NodeJS.Timeout;
};
export declare function foreignSyncHeldLock(route: "raw" | "root", target: string): object | undefined;
export declare function getSyncHeldLocks(): Map<string, SyncHeldLock>;
export declare function getSyncLockAdmissions(): Map<string, object>;
export declare function defaultSyncShouldReclaim(snapshot: SidecarLockSnapshot, staleMs: number, nowMs: number): boolean;
export declare function syncReclaimGuardExists(reclaimGuardPath: string): boolean;
export declare function ensureSyncLockExitCleanupRegistered(cleanup: () => void, lockPath: string, normalizedTargetPath: string): void;
