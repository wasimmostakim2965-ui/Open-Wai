import type { BigIntStats, Stats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import type { RootReadOptions } from "./root-options.js";
type OwnedLocalFile = {
    handle: FileHandle;
    stat: Stats;
    identity: BigIntStats;
    preOpenStat: BigIntStats | undefined;
};
export declare function openLocalFileDescriptor(filePath: string, options?: Pick<RootReadOptions, "hardlinks" | "symlinks"> & {
    readWrite?: true;
}): Promise<OwnedLocalFile>;
export {};
