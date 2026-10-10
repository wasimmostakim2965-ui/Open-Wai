import { type RootBoundaryIdentity } from "./root-boundary.js";
import { type MutationDirectoryObservation } from "./pinned-mutation-observation.js";
import type { PinnedCreatedDirectoryReceipt, PinnedMutationAdmissionReceipt, PinnedMutationAuthorizationToken } from "./pinned-write-types.js";
/**
 * Guard each component from rootReal to targetPath; optionally create missing ones.
 * Returns the resolved path: use it, rather than the lexical input, for later guards.
 */
export declare function mkdirPathComponentsWithGuards(params: {
    rootReal: string;
    targetPath: string;
    beforeComponent?: (componentPath: string) => Promise<void> | void;
    beforeCreateComponent?: (componentPath: string, prospectiveTargetPath: string, retainedTargetPath: string | undefined, parent: MutationDirectoryObservation) => Promise<PinnedMutationAdmissionReceipt | undefined> | PinnedMutationAdmissionReceipt | undefined;
    beforeUseComponent?: (componentPath: string, prospectiveTargetPath: string, retainedTargetPath: string | undefined) => Promise<void> | void;
    afterCreateComponent?: (receipt: PinnedCreatedDirectoryReceipt) => PinnedMutationAuthorizationToken | undefined;
    assertBeforeMutation?: () => void;
    createMissing?: boolean;
    mode?: number;
    private?: boolean;
    rejectSymlinks?: boolean;
    revalidateParentAfterBeforeComponent?: boolean;
    synchronousAuthorizationIncludesFence?: boolean;
    retainedTargetPath?: string;
    rootIdentity?: RootBoundaryIdentity;
}): Promise<string>;
