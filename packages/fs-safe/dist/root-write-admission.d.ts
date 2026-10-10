import type { BigIntStats } from "node:fs";
import { type DenyMutationPolicy } from "./deny-mutations.js";
import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { PinnedWriteMutationAdmission } from "./pinned-write-types.js";
import type { RootContext } from "./root-context.js";
import { resolvePathInRoot } from "./root-context.js";
import { type MutationSymlinkPolicy } from "./root-symlink-policy.js";
import { type PreparedRootWriteParent } from "./root-write-complete-parent.js";
export type PinnedWriteTarget = Readonly<{
    rootReal: string;
    targetPath: string;
    relativeParentPath: string;
    basename: string;
    mode: number;
    mutationAdmission?: PinnedWriteMutationAdmission;
}>;
export type GuardedWritePath = Awaited<ReturnType<typeof resolvePathInRoot>>;
export type SelectedRootWriteTargetAdmission = Readonly<{
    authorize(selectedTargetPath: string): Promise<void>;
}>;
export type GuardedRootWriteTarget = Readonly<{
    resolvedPath: GuardedWritePath;
    targetPath: string;
    mutationAdmission?: PinnedWriteMutationAdmission;
    selectedTargetAdmission?: SelectedRootWriteTargetAdmission;
}>;
export type RootWritePathSelection = Readonly<{
    mutationAdmission: PinnedWriteMutationAdmission;
    selectedTargetAdmission: SelectedRootWriteTargetAdmission;
    operationTargetPath: string;
    selectedPath: string;
    parentGuard: AnyAsyncDirectoryGuard;
}>;
export type RetainedRootWriteSelection = RootWritePathSelection & Readonly<{
    identity: Readonly<Pick<BigIntStats, "dev" | "ino">>;
}>;
export declare function createRootWriteSelectionForFd(selection: RootWritePathSelection, fd: number): RetainedRootWriteSelection;
export declare function assertRootWritePathSelectionSync(root: RootContext, selection: RootWritePathSelection): void;
export declare function assertRootWriteSelectionSync(root: RootContext, selection: RetainedRootWriteSelection, fd?: number): void;
export declare function prepareRootWritePathSelection(params: Omit<RootWritePathSelection, "parentGuard"> & Readonly<{
    preparedParent?: PreparedRootWriteParent;
}>): Promise<RootWritePathSelection>;
export declare function prepareGuardedRootWritePathSelection(guarded: {
    mutationAdmission?: PinnedWriteMutationAdmission;
    selectedTargetAdmission?: SelectedRootWriteTargetAdmission;
} | undefined, selectedPath: string, operationTargetPath?: string, preparedParent?: PreparedRootWriteParent): Promise<RootWritePathSelection | undefined>;
export declare function refreshRootWritePathSelection(selection: RootWritePathSelection): Promise<void>;
/**
 * Re-authorize a retained shared-JavaScript destination without recapturing
 * either its pathname binding or its exact parent fence.
 */
export declare function refreshRootWriteSelection(root: RootContext, selection: RetainedRootWriteSelection, fd?: number): Promise<void>;
export declare function refreshRetainedRootWriteAdmission(root: RootContext, selection: RetainedRootWriteSelection, fd?: number): Promise<void>;
type GuardedWritePathOptions = {
    relativePath: string;
    denyMutations?: DenyMutationPolicy;
    mutationSymlinks?: MutationSymlinkPolicy;
    allowFinalSymlink?: boolean;
    protectDeniedAncestors?: boolean;
    shouldAssertNoPathAlias?: (resolved: GuardedWritePath) => Promise<boolean> | boolean;
};
export declare function resolveGuardedWritePathInRoot(root: RootContext, params: GuardedWritePathOptions): Promise<GuardedWritePath>;
export declare function resolveGuardedWriteTargetInRoot(root: RootContext, params: GuardedWritePathOptions): Promise<GuardedRootWriteTarget>;
export declare function resolvePinnedWriteTargetInRoot(root: RootContext, relativePath: string, requestedMode?: number, denyMutations?: DenyMutationPolicy, overwrite?: boolean, mutationSymlinks?: MutationSymlinkPolicy): Promise<PinnedWriteTarget>;
export {};
