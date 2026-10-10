import type { FileHandle } from "node:fs/promises";
export type WriteFileWindowOptions = {
    signal?: AbortSignal;
    /** Synchronous authority check immediately before every write, including short-write retries. */
    assertBeforeMutation?: () => void;
};
/** Write borrowed bytes completely; null advances the cursor, an explicit position preserves it. */
export declare function writeFileWindowFully(handle: FileHandle, bytes: Uint8Array, position: number | null, options?: WriteFileWindowOptions): Promise<void>;
export declare function writeAllToFile(target: FileHandle | number, data: string | Uint8Array, options?: {
    encoding?: BufferEncoding;
    position?: number;
    assertBeforeMutation?: () => void;
}): Promise<void>;
