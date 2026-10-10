import type { Readable } from "node:stream";
import { ensureSyncStoreDirectory, type SyncStoreDirectoryReceipt } from "./file-store-sync-directory.js";
import { type Root } from "./root.js";
import { prepareSecretFileWrite } from "./secret-file.js";
export type SyncParentGuard = SyncStoreDirectoryReceipt;
export declare function ensureParentInRoot(scopedRoot: Root, relativePath: string, mode: number): Promise<void>;
export declare function openWritableStoreRoot(params: {
    rootDir: string;
    dirMode: number;
    maxBytes?: number;
}): Promise<Root>;
export declare function openPrivateStoreLockRoot(params: Parameters<typeof prepareSecretFileWrite>[0]): Promise<Root>;
export declare function writeStreamToTempSource(params: {
    stream: Readable;
    maxBytes?: number;
    mode: number;
}): Promise<{
    path: string;
    cleanup: () => Promise<void>;
}>;
export declare function ensureParentSync(params: {
    rootDir: string;
    filePath: string;
    mode: number;
}): SyncParentGuard;
export declare function ensureStoreDirectorySync(params: Parameters<typeof ensureSyncStoreDirectory>[0]): SyncParentGuard;
export declare function literalStoreRootPath(relativePath: string): string;
export declare function assertRelativePath(relativePath: string): string;
export declare function resolveStorePath(rootDir: string, relativePath: string): string;
export declare function assertFileStoreMaxBytes(size: number, limit: number | undefined): void;
export declare function readFileStoreCopySource(params: {
    sourcePath: string;
    maxBytes: number;
}): Promise<Buffer>;
