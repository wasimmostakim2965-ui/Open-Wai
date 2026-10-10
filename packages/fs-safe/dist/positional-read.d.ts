import type { FileHandle } from "node:fs/promises";
export type ReadFileWindowOptions = {
    signal?: AbortSignal;
};
/** Fills a caller-owned buffer from an explicit position, stopping at EOF. */
export declare function readFileWindowFully(handle: FileHandle, buffer: Buffer, position: number, { signal }?: ReadFileWindowOptions): Promise<number>;
/** Synchronous positional read; neither variant advances or closes its descriptor. */
export declare function readFileWindowFullySync(fd: number, buffer: Buffer, position: number): number;
