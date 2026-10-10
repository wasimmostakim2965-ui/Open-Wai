import type { PinnedWriteMutationAdmission } from "./pinned-write-types.js";
import { type RootContext } from "./root-context.js";
/**
 * Complete the common Root.mkdir case with one exact existing parent. This is
 * optional evidence: every uncertain probe returns to the ordered root walk.
 */
export declare function tryMkdirAtExactParent(root: RootContext, targetPath: string, mutationAdmission: PinnedWriteMutationAdmission): Promise<boolean>;
export declare function prepareRootWriteTarget(root: RootContext, targetPath: string, assertBeforeMutation?: () => void, mutationAdmission?: PinnedWriteMutationAdmission, privateMode?: boolean): Promise<string>;
export declare function mkdirPathFallback(root: RootContext, resolved: {
    rootReal: string;
    resolved: string;
}, assertBeforeMutation?: () => void, rejectSymlinks?: boolean, mutationAdmission?: PinnedWriteMutationAdmission, privateMode?: boolean): Promise<void>;
