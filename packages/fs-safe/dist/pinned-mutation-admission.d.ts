import { type DenyMutationPolicy } from "./deny-mutations.js";
import { type RootBoundaryIdentity } from "./root-boundary.js";
import type { PinnedWriteMutationAdmission } from "./pinned-write-types.js";
import type { MutationSymlinkPolicy } from "./root-symlink-policy.js";
export type PinnedMutationPolicySnapshot = Readonly<{
    denyMutations?: DenyMutationPolicy;
    mutationSymlinks?: MutationSymlinkPolicy;
}>;
export declare function snapshotPinnedMutationPolicy(denyMutations: DenyMutationPolicy | undefined, mutationSymlinks: MutationSymlinkPolicy | undefined): PinnedMutationPolicySnapshot | undefined;
export declare function preparePinnedWriteMutationAdmission(params: {
    rootReal: string;
    rootIdentity?: RootBoundaryIdentity;
    resolvedTargetPath: string;
    defaultRelativeParentPath: string;
    originalPath?: string;
    policy: PinnedMutationPolicySnapshot | undefined;
    resolveCurrent(): Promise<{
        resolved: string;
    }>;
}): Promise<{
    relativeParentPath: string;
    mutationAdmission?: PinnedWriteMutationAdmission;
}>;
