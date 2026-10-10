import { type BigIntStats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { type CopyCloneMode } from "./copy-policy.js";
import { type NativeBinding } from "./native.js";
import { type NativeFileCopyResult } from "./native-binding.js";
export type CopyFileInput = {
    kind: "file";
    handle: FileHandle;
    size: number;
    clone: CopyCloneMode;
    signal?: AbortSignal;
    verifySource(): Promise<void>;
};
export declare function resolveFileCopyCloneMode(mode?: CopyCloneMode): CopyCloneMode;
export declare function assertCopySourceCurrent(source: {
    handle: FileHandle;
    realPath: string;
}, identity: BigIntStats): Promise<void>;
export declare function writeCopyFileToFd(fd: number, input: CopyFileInput, maxBytes?: number, assertBeforeMutation?: () => void): Promise<void>;
export declare function createNativeCopyFile(native: NativeBinding, input: CopyFileInput, parentFd: number, basename: string, maxBytes: number | undefined): Promise<NativeFileCopyResult | undefined>;
export declare function assertNativeCopyCompleted(input: CopyFileInput, copied?: NativeFileCopyResult): void;
