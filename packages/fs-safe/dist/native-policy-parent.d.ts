import { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import type { NativeBinding } from "./native.js";
import type { NativeRootAdmission } from "./native-parent-admission.js";
import type { PinnedWriteParams } from "./pinned-write-types.js";
import { describeStagedDirectory, type PolicyStagedDirectory } from "./staged-directory.js";
import { type MutationDirectoryObservation } from "./pinned-mutation-observation.js";
export type NativePolicyParent = {
    fd: number;
    guard: AsyncDirectoryGuard<BigIntStats>;
    observation: MutationDirectoryObservation;
    stagedDirectory?: ReturnType<typeof describeStagedDirectory>;
    policyDirectory?: PolicyStagedDirectory;
};
export declare function capturePolicyAwareNativeParent(binding: NativeBinding, params: PinnedWriteParams, rootAdmission: NativeRootAdmission, windows: boolean, directoryFlags: number, fuseChildCreation?: boolean): Promise<NativePolicyParent>;
