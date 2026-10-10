import type { BigIntStats } from "node:fs";
import { FsSafeError } from "./errors.js";
import type { StagedSymlinkFailureDetails } from "./staged-symlink-types.js";
import type { StagedFileCleanupReceipt, StagedFileFailureDetails, StagedFilePublication, StagedFileReceipt } from "./staged-file-types.js";
export declare function createStagedFileReceipt(directory: StagedFileReceipt["directory"], temporaryBasename: string, stat: BigIntStats): StagedFileReceipt;
export declare function stagedFailure(kind: "file" | "symlink", error: unknown, details: StagedFileFailureDetails | StagedSymlinkFailureDetails): FsSafeError;
/** Finish owned cleanup and every close before surfacing publication evidence. */
export declare function settleStagedFile(params: {
    temporaryBasename: string;
    publication: StagedFilePublication;
    phase: StagedFileFailureDetails["phase"];
    failure?: {
        error: unknown;
    };
    cleanup: () => Promise<StagedFileCleanupReceipt["status"]>;
    close: readonly (() => Promise<void> | void)[];
}): Promise<void>;
