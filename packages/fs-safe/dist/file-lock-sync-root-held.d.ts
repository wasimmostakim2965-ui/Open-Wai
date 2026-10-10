import { type SyncHeldLock } from "./file-lock-sync-admission.js";
import type { SidecarLockOptionFields } from "./sidecar-lock-types.js";
import type { FileLockSyncHandle } from "./file-lock-sync.js";
import { type FileLockSyncRootAuthority, type FileLockSyncRootPath } from "./file-lock-sync-root.js";
import { type FileLockSyncRootFileReceipt, type FileLockSyncRootSnapshot } from "./file-lock-sync-root-io.js";
type RootSyncHeldLockReleaseState = "active" | "releasing" | "exit-cleaning" | "released";
type RootSyncHeldLockHandleDisposition = {
    held: RootSyncHeldLock;
    released: boolean;
};
export type RootSyncHeldLock = SidecarLockOptionFields<SyncHeldLock & {
    deferredExitReleases?: Set<RootSyncHeldLockHandleDisposition>;
    releaseState: RootSyncHeldLockReleaseState;
    revision: number;
    rootAuthority: FileLockSyncRootAuthority;
    rootPath: FileLockSyncRootPath;
    rootReceipt: FileLockSyncRootFileReceipt;
}>;
export declare function readRootSidecarSnapshotSync(rootPath: FileLockSyncRootPath, parsePayload?: (raw: string) => unknown, onOpenFailure?: (error: unknown) => void, expectedReceipt?: FileLockSyncRootFileReceipt): FileLockSyncRootSnapshot | null;
export declare function getRootSyncHeldLocks(): Map<string, RootSyncHeldLock>;
export declare function ensureRootSyncExitCleanupRegistered(): void;
export declare function verifyRootSyncHeldLock(held: RootSyncHeldLock): boolean;
export declare function createRootSyncHeldLockHandle(held: RootSyncHeldLock): FileLockSyncHandle;
export declare function withSyncHeldLockHandle<T>(lock: FileLockSyncHandle, fn: () => T): T;
export {};
