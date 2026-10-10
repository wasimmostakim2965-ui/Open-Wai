import { FsSafeError } from "./errors.js";
import type { FileLockSyncHandle } from "./file-lock-sync.js";
import { type FileLockSyncRootAuthority, type FileLockSyncRootPath } from "./file-lock-sync-root.js";
import type { FileLockSyncRootFileReceipt } from "./file-lock-sync-root-io.js";
import { type RootSyncHeldLock } from "./file-lock-sync-root-held.js";
export declare class FileLockSyncRootArbitrationCollision extends FsSafeError {
    constructor();
}
export type FileLockSyncRootArbitration = Readonly<{
    authority: FileLockSyncRootAuthority;
    heldLocks: Map<string, RootSyncHeldLock>;
    lockRootPath: FileLockSyncRootPath;
    normalizedTargetPath: string;
    reentrantOwner?: string;
}>;
export declare function tryReuseCurrentRootSyncHeldLock(arbitration: FileLockSyncRootArbitration): FileLockSyncHandle | undefined;
export declare function cleanupCreatedRootSyncLock(lockRootPath: FileLockSyncRootPath, fd: number, receipt: FileLockSyncRootFileReceipt, timer?: NodeJS.Timeout): void;
