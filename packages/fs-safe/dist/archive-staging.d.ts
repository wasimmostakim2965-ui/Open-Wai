import { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import { type ExtractionDeadline } from "./archive-deadline.js";
import { ArchiveSecurityError } from "./archive-errors.js";
export type ArchiveDirectoryGuard = AsyncDirectoryGuard<BigIntStats>;
export declare function createArchiveSymlinkTraversalError(originalPath: string): ArchiveSecurityError;
export declare function createDirectoryIdentityGuard(dir: string): Promise<ArchiveDirectoryGuard>;
export declare function assertDirectoryIdentityGuard(guard: ArchiveDirectoryGuard): Promise<void>;
export declare function prepareArchiveDestinationGuard(destDir: string): Promise<ArchiveDirectoryGuard>;
export declare function prepareArchiveDestinationDir(destDir: string): Promise<string>;
export declare function assertResolvedInsideDestination(params: {
    destinationRealDir: string;
    targetPath: string;
    originalPath: string;
}): Promise<void>;
type ArchiveOutputPathParams = {
    destinationDir: string;
    destinationRealDir: string;
    relPath: string;
    outPath: string;
    originalPath: string;
    isDirectory: boolean;
    deadline?: ExtractionDeadline;
};
export declare function prepareArchiveOutputPath(params: ArchiveOutputPathParams): Promise<void>;
export declare function preparePrivateArchiveOutputPath(params: ArchiveOutputPathParams, assertGuards?: () => Promise<void>, destinationGuard?: ArchiveDirectoryGuard): Promise<void>;
export declare function withStagedArchiveDestination<T>(params: {
    destinationRealDir: string;
    stagingDirPrefix?: string;
    run: (stagingDir: string) => Promise<T>;
}): Promise<T>;
export {};
