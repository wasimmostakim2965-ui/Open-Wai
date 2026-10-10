import { Writable } from "node:stream";
import type { Gunzip } from "node:zlib";
export declare function isGzipBuffer(input: Uint8Array): boolean;
/** Validate the same physical suffix when admission owns an in-memory input. */
export declare function validateGzipBufferTail(input: Buffer, consumed: number, signal?: AbortSignal): Promise<void>;
/** Track physical input, not the sum of bytes consumed across separate writes:
 * gunzip can resume on a later chunk after leaving an earlier padding gap. */
export declare class GzipInput extends Writable {
    private readonly decoder;
    private position;
    private firstUnused;
    constructor(decoder: Gunzip);
    get tailOffset(): number;
    _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
    _final(callback: (error?: Error | null) => void): void;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
}
/** Check the immutable staged suffix from the first unused physical byte,
 * including later chunks the decoder may have consumed, before returning. */
export declare function validateGzipContainerTail(filePath: string, consumed: number, signal?: AbortSignal): Promise<void>;
