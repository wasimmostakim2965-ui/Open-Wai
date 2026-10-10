import { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import { type NativeRootAdmission } from "./native-parent-admission.js";
import type { NativeBinding } from "./native.js";
import type { PinnedWriteParams } from "./pinned-write-types.js";
import { type MutationDirectoryObservation } from "./pinned-mutation-observation.js";
import type { NativePolicyParent } from "./native-policy-parent.js";
export declare function assertWindowsPolicyParentCurrent(parent: NativePolicyParent): void;
export declare function closeWindowsPolicyParentAfterFailure(closeFd: (fd: number) => void, fd: number, failure?: {
    error: unknown;
}, report?: boolean): void;
export declare function windowsParentObservation(binding: NativeBinding, fd: number, guard: AsyncDirectoryGuard<BigIntStats>): MutationDirectoryObservation;
export declare function openWindowsPolicyParent(binding: NativeBinding, params: PinnedWriteParams, rootAdmission: NativeRootAdmission, fd: number, parentPath: string, relativePath: string): Promise<NativePolicyParent>;
