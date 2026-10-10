import { type FsSafeErrorDetails } from "./errors.js";
export type SymlinkPolicy = "reject" | "follow-within-root" | "follow-parents-within-root";
export type MutationSymlinkPolicy = "reject" | "follow-parents-within-root";
export declare function readSymlinkResolution(symlinks: SymlinkPolicy | undefined): {
    rejectSymlinks: boolean;
    rejectFinalSymlink: boolean;
};
export declare function mutationSymlinkResolution(symlinks: MutationSymlinkPolicy | undefined): {
    rejectSymlinks: boolean;
    rejectFinalSymlink: boolean;
    resolveCanonical: boolean;
};
export declare function assertFinalSymlinkRejected(targetPath: string, reject: boolean | undefined, details?: FsSafeErrorDetails): void;
