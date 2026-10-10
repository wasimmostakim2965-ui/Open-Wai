import { type BigIntStats, type Stats } from "node:fs";
import type { DirectoryReceipt } from "./directory-durability.js";
import type { FileIdentityStat } from "./file-identity.js";
import type { NativeBinding } from "./native-binding.js";
import { type MutationDirectoryObservation, type MutationDirectoryObserver } from "./pinned-mutation-observation.js";
import type { StagedFileReceipt } from "./staged-file-types.js";
export type StagedDirectorySnapshot = StagedFileReceipt["directory"];
export type PolicyStagedDirectory = Readonly<{
    directory: StagedDirectorySnapshot;
    observation: MutationDirectoryObservation;
    stat: BigIntStats;
    observeCurrent?: MutationDirectoryObserver;
    disposeObservation?(): void;
}>;
export declare function exactIdentityMatches(expected: FileIdentityStat, actual: Readonly<{
    dev: bigint;
    ino: bigint;
}>): boolean;
export declare function describeStagedDirectory(fd: number, pathname: string): StagedDirectorySnapshot;
export declare function assertStagedDirectoryCurrent(receipt: StagedDirectorySnapshot): BigIntStats;
export declare function describePolicyStagedDirectory(fd: number, pathname: string, binding?: NativeBinding): PolicyStagedDirectory;
export declare function assertPolicyStagedDirectoryCurrent(captured: PolicyStagedDirectory): BigIntStats;
export declare function refreshPolicyStagedDirectoryObservation(captured: PolicyStagedDirectory): MutationDirectoryObservation;
export declare function openStagedDirectory(directory: string | DirectoryReceipt<Stats | BigIntStats>): {
    fd: number;
    receipt: StagedDirectorySnapshot;
};
