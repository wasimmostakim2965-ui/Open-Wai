import fs, { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard, type DirectoryObservationGuard } from "./directory-guard.js";
export type RootContext = {
    rootDir: string;
    rootGuard?: AsyncDirectoryGuard<BigIntStats>;
    rootIdentity: {
        dev: bigint;
        ino: bigint;
    };
    rootReal: string;
    rootWithSep: string;
};
export declare const ensureTrailingSep: (value: string) => string;
export declare function assertValidRootRelativePath(relativePath: string): void;
export declare function assertValidRootDestinationPath(relativePath: string): void;
export declare function expandRelativePathWithHome(relativePath: string): Promise<string>;
export declare function resolveRootContext(rootDir: string): Promise<RootContext>;
export declare function rootRelativeReadPath(root: RootContext, filePath: string): string;
export declare function assertRootIdentityCurrentSync(root: RootContext, observe?: (stat: fs.BigIntStats) => void): void;
export declare function assertRootIdentityCurrent(root: RootContext, observe?: (stat: fs.BigIntStats) => void): Promise<void>;
/**
 * Observe the current Root with an exact, operation-local receipt.
 *
 * This is deliberately separate from {@link assertRootIdentityCurrent}: callers
 * must not retain the returned guard beyond the operation that requested it.
 */
export declare function createRootObservationGuard(root: RootContext): Promise<DirectoryObservationGuard>;
export declare function resolvePathInRoot(root: RootContext, relativePath: string, options?: {
    aliasErrorCode?: "outside-workspace" | "path-alias";
    allowFinalSymlink?: boolean;
    rejectUnsafeDeviceReads?: boolean;
    rejectSymlinks?: boolean;
    rejectFinalSymlink?: boolean;
    resolveCanonical?: boolean;
    rejectAmbiguousParents?: boolean;
}): Promise<{
    rootReal: string;
    rootWithSep: string;
    resolved: string;
}>;
