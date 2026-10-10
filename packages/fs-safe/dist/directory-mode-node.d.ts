import { type BigIntStats, type Stats } from "node:fs";
export type DirectoryModeChecks = {
    check?: () => void;
    beforeChmod?: () => Promise<void>;
};
export type DirectoryModeOwner = {
    verify(check?: () => void): Promise<void>;
    apply(mode: number, checks?: DirectoryModeChecks): Promise<void>;
    close(): Promise<void>;
};
export declare function assertOwnedDirectory(expected: Stats | BigIntStats, actual: Stats | BigIntStats): void;
/** Serializes use and close: even a queued path-based fd operation retains its descriptor. */
export declare function ownDirectoryMode(params: {
    inspect: () => Promise<number>;
    chmod: (mode: number) => Promise<void>;
    prepareChmod?: () => Promise<void>;
    verifyChmod?: () => Promise<void>;
    close: () => Promise<void>;
    ignoreChmodError?: boolean;
}): DirectoryModeOwner;
/** Darwin descriptor inspection avoids requesting directory-content reads. */
export declare function nodeDarwinDirectoryMetadataFlags(): number;
export declare function nodeDirectorySearchOnlyFlags(): {
    flags: number;
    proc: boolean;
} | undefined;
/** Real Node only: injected filesystem adapters must retain descriptor-chmod semantics. */
export declare function pinNodeDirectoryForMode(dirPath: string, options?: {
    expectedIdentity?: BigIntStats;
    ownerUid?: number;
}): Promise<DirectoryModeOwner>;
/** Synchronous counterpart with the same no-follow, identity, and owner checks. */
export declare function pinNodeDirectoryForModeSync(dirPath: string, options?: {
    expectedIdentity?: BigIntStats;
    ownerUid?: number;
}): {
    apply(mode: number, check?: () => void): void;
    close(): void;
};
