import fsSync from "node:fs";
import type { TempWorkspaceCleanupSafety } from "./temp-workspace-owner.js";
export type TempFile = {
    dir: string;
    path: string;
    file(fileName?: string): string;
    cleanup: () => Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
};
type TempFileOptions = {
    rootDir?: string;
    prefix: string;
    fileName?: string;
    onCleanupError?: (error: unknown) => void;
    cleanupSafety?: TempWorkspaceCleanupSafety;
};
export declare function sanitizeTempFileName(fileName: string): string;
export declare function buildRandomTempFilePath(params: {
    rootDir?: string;
    prefix: string;
    extension?: string;
    now?: number;
    uuid?: string;
}): string;
export declare function createOwnedTempFile(params: TempFileOptions): Promise<{
    target: TempFile;
    identity: Readonly<Pick<fsSync.BigIntStats, "dev" | "ino">>;
}>;
export declare function tempFile(params: TempFileOptions): Promise<TempFile>;
export declare function withTempFile<T>(params: TempFileOptions, fn: (tmpPath: string) => Promise<T>): Promise<T>;
export {};
