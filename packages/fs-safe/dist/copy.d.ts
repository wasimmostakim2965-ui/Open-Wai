import { type CopyCloneMode } from "./copy-policy.js";
export { readCloneFileMetadata, type CloneFileMetadata } from "./clone-metadata.js";
export type { CopyCloneMode } from "./copy-policy.js";
export type TreeCloneBackend = "apfs" | "btrfs" | "refs" | "xfs" | "zfs";
export type CopyTreeOptions = {
    clone?: CopyCloneMode;
    signal?: AbortSignal;
    concurrency?: number;
};
/** Inspect an existing real directory without creating probe files. */
export declare function probeTreeClone(parentPath: string): TreeCloneBackend | undefined;
/** Create an empty clone source: a Btrfs subvolume or an ordinary supported directory. */
export declare function createCloneSource(destination: string, options?: Pick<CopyTreeOptions, "signal">): Promise<void>;
/** Copy an immutable, caller-owned tree, preferring native cloning unless configured otherwise. */
export declare function copyTree(source: string, destination: string, options?: CopyTreeOptions): Promise<void>;
