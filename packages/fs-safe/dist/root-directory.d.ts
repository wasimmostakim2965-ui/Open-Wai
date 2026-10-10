import { FsSafeError } from "./errors.js";
export type DirectoryResult = {
    ok: true;
    path: string;
} | {
    ok: false;
    error: string;
    diagnostic?: FsSafeError;
};
export declare function resolveNearestExistingPath(targetPath: string): string;
export declare function assertNoSymlinkSegments(params: {
    rootDir: string;
    targetPath: string;
    scopeLabel: string;
}): Promise<void>;
export declare function ensureDirectoryWithinRoot(params: {
    rootDir: string;
    requestedPath: string;
    scopeLabel: string;
    defaultDirName?: string;
    mode?: number;
}): Promise<DirectoryResult>;
