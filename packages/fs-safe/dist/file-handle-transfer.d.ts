import type { FileHandle } from "node:fs/promises";
export type CopyFileHandleOptions = {
    maxBytes?: number;
    signal?: AbortSignal;
    onChunk?: (chunk: Uint8Array) => void;
    assertBeforeMutation?: () => void;
};
/** Copies caller-owned regular-file descriptors without moving either cursor. */
export declare function copyFileDescriptorSync(sourceFd: number, targetFd: number, options?: CopyFileHandleOptions): number;
/** Copies caller-owned regular files from offset zero without moving either cursor. */
export declare function copyFileHandle(source: FileHandle, target: FileHandle, options?: CopyFileHandleOptions): Promise<number>;
export declare function transferFileHandle(source: FileHandle, target: FileHandle | number, options: CopyFileHandleOptions & {
    sizeHint: number;
    targetPosition?: number;
}): Promise<number>;
