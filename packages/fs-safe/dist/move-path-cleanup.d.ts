import fsSync from "node:fs";
export type EntryIdentity = Readonly<Pick<fsSync.BigIntStats, "ctimeNs" | "dev" | "ino" | "mode" | "mtimeNs" | "nlink" | "size">>;
export type CopiedEntryManifest = (EntryIdentity & {
    children: Array<{
        name: string;
        manifest: CopiedEntryManifest;
    }>;
    directoryIdentity: Readonly<Pick<fsSync.BigIntStats, "dev" | "ino">>;
    kind: "directory";
}) | (EntryIdentity & {
    kind: "leaf";
});
type CleanupCopiedEntryResult = "removed" | "stale";
type CleanupAliasGroup = {
    expected: EntryIdentity;
    remainingPaths: Set<string>;
    stale: boolean;
};
export type CleanupCopiedEntryState = {
    aliasGroups: Map<string, CleanupAliasGroup>;
};
export declare function entryIdentity(stat: EntryIdentity): EntryIdentity;
export declare function sameIdentity(a: EntryIdentity, b: EntryIdentity): boolean;
export declare function sourceChangedError(sourcePath: string): Error;
export declare function inspectSourceEntry(sourcePath: string, observe: () => fsSync.BigIntStats): fsSync.BigIntStats;
export declare function inspectSourceDirectory(sourcePath: string, expected?: Pick<fsSync.BigIntStats, "dev" | "ino">): fsSync.BigIntStats;
export declare function assertSourceStillMatches(sourcePath: string, identity: EntryIdentity): Promise<void>;
export declare function createCleanupCopiedEntryState(sourcePath: string, manifest: CopiedEntryManifest): CleanupCopiedEntryState;
export declare function cleanupCopiedEntry(sourcePath: string, manifest: CopiedEntryManifest, state: CleanupCopiedEntryState, assertBeforeMutation: (() => void) | undefined): Promise<CleanupCopiedEntryResult>;
export {};
