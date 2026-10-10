import { type RootContext } from "./root-context.js";
import { type SymlinkPolicy } from "./root-symlink-policy.js";
import type { DirEntry } from "./types.js";
export type RootEntriesOptions = {
    maxEntries?: number;
    order?: "filesystem" | "sorted";
    signal?: AbortSignal;
    symlinks?: SymlinkPolicy;
};
export declare function entriesInRoot(root: RootContext, relativePath: string, options: RootEntriesOptions): AsyncGenerator<DirEntry>;
