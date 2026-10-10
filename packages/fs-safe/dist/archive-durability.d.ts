import { type ExtractionDeadline } from "./archive-deadline.js";
import { type ArchiveDirectoryGuard } from "./archive-staging.js";
import type { PublishedWriteIdentity } from "./pinned-write-types.js";
import type { Root } from "./root.js";
export type ArchivePublishedFile = {
    relativePath: string;
    identity: PublishedWriteIdentity;
    guards: readonly ArchiveDirectoryGuard[];
};
export type ArchivePublishedDirectory = {
    guard: ArchiveDirectoryGuard;
    parents: readonly ArchiveDirectoryGuard[];
    mode: number;
};
export declare function finalizeArchivePublication(params: {
    targetRoot: Root;
    destinationGuard: ArchiveDirectoryGuard;
    sourceGuard: ArchiveDirectoryGuard;
    files: readonly ArchivePublishedFile[];
    directories: readonly ArchivePublishedDirectory[];
    durable: boolean;
    deadline?: ExtractionDeadline;
}): Promise<void>;
