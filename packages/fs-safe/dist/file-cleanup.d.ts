import { type BigIntStats } from "node:fs";
import { type FileHandle } from "node:fs/promises";
import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
export declare function readErrorCode(error: unknown): unknown;
export declare function hasErrorCode(error: unknown, expected: string): boolean;
type OwnedPathCleanupStatus = "removed" | "name-absent" | "preserved";
export declare function cleanupPinnedFilePath(params: {
    pathname: string;
    handle: Pick<FileHandle, "fd">;
    identity?: BigIntStats;
    parentGuard: AnyAsyncDirectoryGuard;
    throwOnCleanupError?: boolean;
}): Promise<OwnedPathCleanupStatus>;
export {};
