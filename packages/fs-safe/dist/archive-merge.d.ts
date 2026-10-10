import { type ExtractionDeadline } from "./archive-deadline.js";
import { type ArchiveDirectoryGuard } from "./archive-staging.js";
export type ArchivePublicationEntry = {
    path: string;
    kind: "file" | "directory";
    mode: number;
};
type MergeParams = {
    sourceDir: string;
    destinationDir: string;
    destinationRealDir: string;
    deadline?: ExtractionDeadline;
};
type GuardedMergeParams = Pick<MergeParams, "sourceDir" | "deadline"> & {
    destinationGuard: ArchiveDirectoryGuard;
};
export declare function withStagedArchivePublication(params: Omit<GuardedMergeParams, "sourceDir"> & {
    durable?: boolean;
    entryUmask?: number;
}, extract: (stagingDir: string) => Promise<readonly ArchivePublicationEntry[]>): Promise<void>;
export declare function mergeExtractedTreeIntoDestination(params: MergeParams): Promise<void>;
export {};
