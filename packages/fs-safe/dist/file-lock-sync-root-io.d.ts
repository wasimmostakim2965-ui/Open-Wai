import { type BigIntStats } from "node:fs";
import type { RootDefaults } from "./root-options.js";
import { type FileLockSyncRootPath } from "./file-lock-sync-root.js";
export type ExactIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export type DirectoryReceipt = Readonly<{
    identity: ExactIdentity;
    path: string;
    realPath: string;
}>;
export type FileLockSyncRootFileReceipt = Readonly<{
    identity: ExactIdentity;
    parent: DirectoryReceipt;
}>;
export type FileLockSyncRootDirectoryReceipt = FileLockSyncRootFileReceipt;
export type FileLockSyncRootDiskSnapshot = {
    ownershipToken?: never;
    payload: unknown;
    raw: string;
    stat: BigIntStats;
};
export type FileLockSyncRootSnapshot = Readonly<{
    receipt: FileLockSyncRootFileReceipt;
    snapshot: FileLockSyncRootDiskSnapshot;
}>;
export declare function observeDirectory(pathname: string, initial?: BigIntStats): DirectoryReceipt;
export declare function assertDirectoryCurrent(receipt: DirectoryReceipt, initial?: BigIntStats): void;
export declare function assertRetainedParentCurrent(pathAuthority: FileLockSyncRootPath, parent: DirectoryReceipt): void;
export declare function exactFileIdentity(stat: BigIntStats): ExactIdentity;
export declare function assertRegularFile(stat: BigIntStats, hardlinks: RootDefaults["hardlinks"]): void;
export declare function sameExactIdentity(left: ExactIdentity, right: ExactIdentity): boolean;
export declare function readFileLockSyncRootSnapshot(pathAuthority: FileLockSyncRootPath, options?: {
    expectedReceipt?: FileLockSyncRootFileReceipt;
    onOpenFailure?: (error: unknown) => void;
}): FileLockSyncRootSnapshot | null;
export declare function fileLockSyncRootSnapshotStillCurrent(pathAuthority: FileLockSyncRootPath, observed: FileLockSyncRootSnapshot): boolean;
export declare function fileReceiptCurrentAfterParentCheck(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootFileReceipt): boolean;
export declare function fileLockSyncRootReceiptStillCurrent(pathAuthority: FileLockSyncRootPath, receipt: FileLockSyncRootFileReceipt): boolean;
