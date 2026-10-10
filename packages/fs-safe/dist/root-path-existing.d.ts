import { type RootBoundaryIdentity } from "./root-boundary.js";
export declare function absolutePathWithRawSegments(candidate: string): string;
export declare function rawPathRelativeToCanonicalRoot(candidate: string, rootCanonicalPath: string, options?: {
    rejectSymlinks?: boolean;
    rejectFinalSymlink?: boolean;
    rootIdentity?: RootBoundaryIdentity;
}): string | undefined;
export declare function resolvePathViaExistingAncestor(targetPath: string): Promise<string>;
export declare function resolvePathViaExistingAncestorSync(targetPath: string): string;
export type RootPathMetadataMode = "native" | "ordinary";
export declare function resolveExistingAncestor(targetPath: string, mode: RootPathMetadataMode): string;
export declare function resolveSymlinkHopPath(symlinkPath: string, mode: RootPathMetadataMode, rejectUnresolved?: boolean): string;
