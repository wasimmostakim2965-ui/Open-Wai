import type { ArchiveKind } from "./archive-kind.js";
import { type ResolvedArchiveExtractLimits, type ArchiveExtractLimits } from "./archive-limits.js";
import type { ExtractionDeadline } from "./archive-deadline.js";
export type ArchiveMemberKind = "file" | "directory" | "symlink" | "hardlink" | "blocked" | "sparse" | "other";
export type ArchivePlanEntry = {
    path: string;
    kind: "file" | "directory";
    size: number;
    mode: number;
};
export type ArchivePlanOptions = Pick<ExtractArchiveOptions, "stripComponents" | "limits" | "entryModes" | "entryFilter" | "onFiltered"> & {
    rootDir?: string;
    escapeLabel?: string;
};
export declare function createArchiveEntrySelector(params: ArchivePlanOptions): {
    limits: ResolvedArchiveExtractLimits;
    select(entry: {
        path: string;
        kind: ArchiveEntryKind;
        size: number;
    }): string | null;
};
export declare function createArchiveEntryPlanner(params: ArchivePlanOptions, archiveKind: ArchiveKind): (entry: {
    path: string;
    kind: ArchiveMemberKind;
    size: number;
    mode?: number;
}) => ArchivePlanEntry | null;
export type ArchiveEntryKind = "file" | "directory" | "symlink" | "other";
export type ArchiveEntryModePolicy = "clamp" | "preserve";
export type ArchiveFilteredEntryPolicy = "reject-archive" | "skip-entry";
export type ArchiveEntryFilter = (entry: {
    /** Validated canonical archive path before stripping: / separators, no empty or . components. */
    path: string;
    kind: ArchiveEntryKind;
    size: number;
}) => "extract" | "skip";
export declare function archiveEntryKindFromTarType(type: string): ArchiveEntryKind;
export declare function resolveArchiveEntryMode(params: {
    kind: "file" | "directory";
    archivedMode?: number | null;
    policy?: ArchiveEntryModePolicy;
}): number;
export declare function resolveArchiveFilteredEntryPolicy(value: unknown): ArchiveFilteredEntryPolicy;
export declare function shouldExtractArchiveEntry(params: {
    filter?: ArchiveEntryFilter;
    onFiltered?: ArchiveFilteredEntryPolicy;
    entry: Parameters<ArchiveEntryFilter>[0];
}): boolean;
export type TarEntryInfo = {
    path: string;
    type: string;
    size: number;
    mode?: number;
};
export declare function createTarEntryPlanner(params: ArchivePlanOptions): (entry: TarEntryInfo) => ArchivePlanEntry | null;
export declare function createTarEntryPreflightChecker(params: Omit<ArchivePlanOptions & {
    rootDir: string;
}, "entryModes">): (entry: TarEntryInfo) => boolean;
export type ArchiveLogger = {
    info?: (message: string) => void;
    warn?: (message: string) => void;
};
export type ExtractArchiveOptions = {
    archivePath: string;
    destDir: string;
    timeoutMs: number;
    /** Sync published files and directories before returning. Defaults to false. */
    durable?: boolean;
    kind?: ArchiveKind;
    stripComponents?: number;
    tarGzip?: boolean;
    limits?: ArchiveExtractLimits;
    logger?: ArchiveLogger;
    entryModes?: ArchiveEntryModePolicy;
    /** Remove these rwx bits from final entry modes. Defaults to zero. */
    entryUmask?: number;
    entryFilter?: ArchiveEntryFilter;
    onFiltered?: ArchiveFilteredEntryPolicy;
};
/** Private executors receive owned options and an already-staged archive path. */
export type StagedArchiveExtractOptions = Pick<ExtractArchiveOptions, "archivePath" | "destDir" | "durable" | "stripComponents" | "entryModes" | "entryUmask" | "entryFilter" | "onFiltered"> & {
    limits: ResolvedArchiveExtractLimits;
    deadline: ExtractionDeadline;
};
