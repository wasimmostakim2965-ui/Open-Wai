import type { BigIntStats, Stats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { type FileIdentityStat } from "./file-identity.js";
export declare function resolveOpenedFileRealPathForHandle(handle: FileHandle, ioPath: string): Promise<string>;
export declare function resolveOpenedFileRealPathForFd(fd: number, handleStat: {
    dev: bigint;
    ino: bigint;
}, ioPath: string): Promise<{
    realPath: string;
    stat: BigIntStats;
}>;
export declare function resolveOpenedFileRealPathForFd(fd: number, handleStat: FileIdentityStat, ioPath: string): Promise<{
    realPath: string;
    stat: Stats | BigIntStats;
}>;
