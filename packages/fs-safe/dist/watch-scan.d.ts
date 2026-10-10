import { type RootContext } from "./root-context.js";
import { type RootDirectoryObservationGuard } from "./root-directory-list.js";
import type { RootDirectoryListingPaths } from "./root-directory-list-types.js";
import type { WatchEntry, WatchOptions, WatchScope } from "./watch-types.js";
export type DirectoryIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export type WatchEntryAnchor = {
    directory: string;
    name: string;
    target?: DirectoryIdentity & {
        kind: WatchEntry["kind"];
    };
};
export type WatchSnapshot = {
    entries: Map<string, string>;
    entryAnchors?: Map<string, WatchEntryAnchor>;
    excluded?: Map<string, WatchEntry["kind"]>;
    excludedDirectories?: Map<string, string>;
    directoryPaths?: Map<string, string>;
    directories: Map<string, DirectoryIdentity>;
    targets: Map<string, DirectoryIdentity>;
    scanned: number;
    structural?: Set<string>;
    overflow?: boolean;
    scopeAnchors?: Map<string, WatchEntryAnchor>;
    listed?: Map<string, number>;
    childPaths?: Map<string, Map<string, string>>;
    listingPaths?: Map<string, RootDirectoryListingPaths>;
};
export declare function watchScopes(input: readonly WatchScope[]): readonly WatchScope[];
/** A descendant's unavailable metadata never grants it authority or retires the Root. */
export declare function isWatchPathError(error: unknown): boolean;
export declare function scanWatch(root: RootContext, scopes: readonly WatchScope[], options: Pick<WatchOptions, "exclude"> & {
    maxEntries: number;
    maxDirectories: number;
    maxPendingPaths: number;
    admitting: boolean;
    previous?: WatchSnapshot;
}, signal: AbortSignal, register: (name: string, identity: DirectoryIdentity, guard: RootDirectoryObservationGuard) => Promise<void>, onCleanupFailure?: (error: unknown) => void): Promise<WatchSnapshot>;
