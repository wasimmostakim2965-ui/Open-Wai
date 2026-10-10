import type { PinnedMutationPolicySnapshot } from "./pinned-mutation-admission.js";
import type { RootBoundaryIdentity } from "./root-boundary.js";
export type ExactRootIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export declare function ordinaryWindowsSegments(relativePath: string): boolean;
export declare function ordinarySharedAbsoluteInsideRoot(rootReal: string, candidatePath: string, rootIdentity: ExactRootIdentity): boolean;
export declare function simpleSharedRoute(params: {
    rootReal: string;
    rootIdentity?: RootBoundaryIdentity;
    originalPath?: string;
    selectedTarget: string;
    policy: PinnedMutationPolicySnapshot;
}): {
    route: string;
    rootIdentity: ExactRootIdentity;
} | undefined;
