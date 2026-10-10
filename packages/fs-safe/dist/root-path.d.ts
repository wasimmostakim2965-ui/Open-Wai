import { type RootBoundaryIdentity } from "./root-boundary.js";
import { type RootPathObservationReceipt, type RootPathObservationRequest } from "./root-path-observation.js";
import type { RemovalPathReceipts } from "./root-remove-receipt.js";
export { resolvePathViaExistingAncestorSync } from "./root-path-existing.js";
export { RootPathObservationError, type RootPathDirectoryObservationGuard, type RootPathObservationKind, type RootPathObservationReceipt, type RootPathParentObservationReceipt, type RootPathObservationRequest, type RootPathTargetObservation, } from "./root-path-observation.js";
type RootPathIntent = "read" | "write" | "create" | "delete" | "stat";
export type RootPathAliasPolicy = {
    allowFinalSymlinkForUnlink?: boolean;
    allowFinalHardlinkForUnlink?: boolean;
};
export declare const ROOT_PATH_ALIAS_POLICIES: {
    readonly strict: Readonly<{
        allowFinalSymlinkForUnlink: false;
        allowFinalHardlinkForUnlink: false;
    }>;
    readonly unlinkTarget: Readonly<{
        allowFinalSymlinkForUnlink: true;
        allowFinalHardlinkForUnlink: true;
    }>;
};
type ResolveRootPathParams = {
    absolutePath: string;
    rootPath: string;
    boundaryLabel: string;
    intent?: RootPathIntent;
    policy?: RootPathAliasPolicy;
    rejectSymlinks?: boolean;
    rejectFinalSymlink?: boolean;
    rejectUnresolvedSymlinks?: boolean;
    skipLexicalRootCheck?: boolean;
    rootCanonicalPath?: string;
    rootIdentity?: RootBoundaryIdentity;
};
type ResolvedRootPathKind = "missing" | "file" | "directory" | "symlink" | "other";
export type ResolvedRootPath = {
    absolutePath: string;
    canonicalPath: string;
    rootPath: string;
    rootCanonicalPath: string;
    relativePath: string;
    exists: boolean;
    kind: ResolvedRootPathKind;
};
export type ObservedRootPath = {
    resolved: ResolvedRootPath;
    receipt?: RootPathObservationReceipt;
};
export declare function resolveRootPath(params: ResolveRootPathParams): Promise<ResolvedRootPath>;
export declare function resolveRootPathWithCanonicalRootObservation(params: ResolveRootPathParams, observeRoot: (rootCanonicalPath: string) => void): Promise<ResolvedRootPath>;
export declare function resolveRootPathWithObservation(params: ResolveRootPathParams, request: RootPathObservationRequest): Promise<ObservedRootPath>;
export declare function resolveRootPathForRemoval(params: ResolveRootPathParams, receipts: RemovalPathReceipts): Promise<ResolvedRootPath>;
export declare function resolveRootPathSync(params: ResolveRootPathParams): ResolvedRootPath;
export declare function resolveRootPathSyncWithCanonicalRootObservation(params: ResolveRootPathParams, observeRoot: (rootCanonicalPath: string) => void): ResolvedRootPath;
