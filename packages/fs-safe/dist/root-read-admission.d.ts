import { type BigIntStats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { type RootContext } from "./root-context.js";
import type { HardlinkPolicy } from "./root-options.js";
import type { SymlinkPolicy } from "./root-symlink-policy.js";
export declare function inspectOpenedPathIdentitySync(filePath: string, symlinks: SymlinkPolicy | undefined): BigIntStats;
type OwnedRootReadHandle = {
    handle: FileHandle;
    stat: {
        nlink: number;
    };
};
export declare function admitRootReadHandle<T extends OwnedRootReadHandle>(params: {
    root: RootContext;
    filePath: string;
    opened: T;
    identity: BigIntStats;
    hardlinks?: HardlinkPolicy;
    symlinks?: SymlinkPolicy;
    beforeFinalFence?: (filePath: string, handle: FileHandle) => Promise<void> | void;
    afterPathIdentityCheck?: (filePath: string, handle: FileHandle) => void;
}): Promise<T & {
    realPath: string;
}>;
export {};
