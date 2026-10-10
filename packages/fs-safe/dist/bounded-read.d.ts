import type { FileHandle } from "node:fs/promises";
type ReadableFileHandle = Pick<FileHandle, "read">;
export declare function readBoundedAsync(maxBytes: number, readChunk: (scratch: Buffer, length: number) => Promise<number>, options?: {
    observeRegularFileSize?: () => number | undefined;
    initialSize?: number;
    createLimitError?: () => Error;
    /** Keep the result outside Node's shared small-buffer allocation pool. */
    unpooled?: boolean;
}): Promise<Buffer>;
/**
 * Reads from the handle's current offset without closing it. A bounded read
 * consumes at most maxBytes + 1 bytes so growth after an earlier stat cannot
 * force an unbounded allocation.
 */
export declare function readFileHandleBounded(handle: ReadableFileHandle, maxBytes: number): Promise<Buffer>;
/** Async bounded read from a numeric descriptor. The caller owns the descriptor. */
export declare function readFileDescriptorBounded(fd: number, maxBytes: number): Promise<Buffer>;
export declare function readBoundedSync(maxBytes: number, readChunk: (scratch: Buffer, length: number) => number, options?: {
    observeRegularFileSize?: () => number | undefined;
    initialSize?: number;
    createLimitError?: () => Error;
}): Buffer;
/** Sync bounded read from a numeric descriptor. The caller owns the descriptor. */
export declare function readFileDescriptorBoundedSync(fd: number, maxBytes: number): Buffer;
export {};
