import { type SidecarLockSnapshot } from "./sidecar-lock-reclaim.js";
import { type FileLockSyncRootPath } from "./file-lock-sync-root.js";
import { type FileLockSyncRootDirectoryReceipt, type FileLockSyncRootFileReceipt } from "./file-lock-sync-root-io.js";
export declare function createFileLockSyncRootFile(pathAuthority: FileLockSyncRootPath, options: {
    assertBeforeOpen: () => void;
    onOpenFailure: (error: unknown) => void;
}): {
    fd: number;
    receipt: FileLockSyncRootFileReceipt;
};
export declare function refreshFileLockSyncRootFileReceipt(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootFileReceipt): FileLockSyncRootFileReceipt;
export declare function removeFileLockSyncRootFile(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootFileReceipt, expected?: SidecarLockSnapshot, assertBeforeRemove?: () => boolean | void): boolean;
export declare function fileLockSyncRootGuardExists(pathAuthority: FileLockSyncRootPath): boolean;
export declare function createFileLockSyncRootDirectory(pathAuthority: FileLockSyncRootPath): FileLockSyncRootDirectoryReceipt | null;
export declare function removeFileLockSyncRootDirectory(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootDirectoryReceipt): boolean;
export declare function fileLockSyncRootDirectoryReceiptStillCurrent(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootDirectoryReceipt): boolean;
