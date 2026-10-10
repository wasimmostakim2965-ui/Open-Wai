import { type BigIntStats } from "node:fs";
export type NativeFileHandle = {
    readonly fd: number;
    close(): Promise<void>;
    writeFile(data: string | Buffer, encoding?: BufferEncoding): Promise<void>;
};
export declare function nativeOpenFlags(flags: number): number;
export declare function writeNativeFd(fd: number, data: Buffer): void;
export declare function removeNativeCreatedFileIfStillPinned(params: {
    parentPath: string;
    parentFd: number;
    basename: string;
    created?: BigIntStats;
}): void;
export declare function createNativeExclusiveFile(targetPath: string, mode: number): Promise<NativeFileHandle | undefined>;
