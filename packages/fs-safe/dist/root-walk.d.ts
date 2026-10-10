import type { DirectoryObservationGuard } from "./directory-guard.js";
import { type RootPathObservationReceipt } from "./root-path.js";
import type { RootDirectoryListing, RootDirectoryListingOptions } from "./root-directory-list-types.js";
import type { PathStat } from "./types.js";
export type RootWalkSymlinkPolicy = "skip" | "follow-within-root" | "include";
type LegacyRootWalkSymlinkPolicy = Exclude<RootWalkSymlinkPolicy, "include">;
export type RootWalkLimitBehavior = "truncate" | "throw";
export type RootWalkDirectoryErrorBehavior = "throw" | "skip-and-report";
export type RootWalkEntryFilterResult = "include" | "skip" | "skip-subtree";
export type RootWalkDataEntryKind<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = "file" | "directory" | "other" | ("include" extends Policy ? "symlink" : never);
export type RootWalkEntryKind<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = RootWalkDataEntryKind<Policy> | "directory-error" | "truncated";
type WalkEntryOfKind<Kind extends RootWalkDataEntryKind<RootWalkSymlinkPolicy>> = {
    relativePath: string;
    kind: Kind;
    size: number;
};
export type RootWalkDataEntry<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = WalkEntryOfKind<RootWalkDataEntryKind> | ("include" extends Policy ? WalkEntryOfKind<"symlink"> : never);
export type RootWalkEntry<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = RootWalkDataEntry<Policy> | {
    relativePath: string;
    kind: "truncated";
    size: 0;
} | {
    relativePath: string;
    kind: "directory-error";
    size: 0;
    error: unknown;
};
export type RootWalkEntryFilter<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = (entry: RootWalkDataEntry<Policy>) => RootWalkEntryFilterResult | Promise<RootWalkEntryFilterResult>;
export type RootWalkOptions<Policy extends RootWalkSymlinkPolicy = LegacyRootWalkSymlinkPolicy> = {
    maxDepth?: number;
    maxEntries?: number;
    order?: "sorted" | "filesystem";
    symlinkPolicy: Policy;
    signal?: AbortSignal;
    limitBehavior?: RootWalkLimitBehavior;
    entryFilter?: RootWalkEntryFilter<Policy>;
    onDirectoryError?: RootWalkDirectoryErrorBehavior;
};
type AnyRootWalkOptions = RootWalkOptions | RootWalkOptions<"include"> | RootWalkOptions<RootWalkSymlinkPolicy>;
type AnyRootWalkEntry = RootWalkEntry<RootWalkSymlinkPolicy>;
type RootWalkCapability = {
    rootReal: string;
    observeRoot(): Promise<DirectoryObservationGuard>;
    stat(relativePath: string): Promise<PathStat>;
    list(relativePath: string, options: RootDirectoryListingOptions, receipt?: RootPathObservationReceipt): Promise<RootDirectoryListing>;
};
export declare function walkRoot(root: RootWalkCapability, relativePath: string, options: AnyRootWalkOptions): AsyncGenerator<AnyRootWalkEntry>;
export {};
