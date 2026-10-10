import { type BigIntStats } from "node:fs";
import { type AtomicIo, type Procedure } from "./atomic-io.js";
import { AtomicMutation } from "./replace-file-mutation.js";
export type ReplaceFileDestinationHardlinkPolicy = "reject";
export type ReplaceFileCopyFallbackRestorePolicy = "restore-original" | "none";
export type ReplaceFileAtomicRestoreCleanup = "restored" | "restore-failed";
export type ReplaceFileAtomicRestoreFailureDetails = {
    cleanup: ReplaceFileAtomicRestoreCleanup;
};
export declare function assertDestinationHardlinkPolicy(io: AtomicIo, dest: string, policy?: ReplaceFileDestinationHardlinkPolicy): Procedure<void>;
export declare function copyFallbackReplace(io: AtomicIo, params: {
    src: string;
    dest: string;
    destinationHardlinks?: ReplaceFileDestinationHardlinkPolicy;
    restore: ReplaceFileCopyFallbackRestorePolicy;
    maxRestoreBytes?: number;
    expectedSourceIdentity?: BigIntStats;
    sync: boolean;
    mutation?: AtomicMutation;
}): Procedure<void>;
