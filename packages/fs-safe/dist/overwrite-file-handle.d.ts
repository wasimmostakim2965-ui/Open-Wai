import type { FileHandle } from "node:fs/promises";
export type OverwriteFileHandleOptions = {
    /** Admit the whole write once, after rollback preparation and before any mutation. */
    beforeWrite?: () => void;
};
/** Overwrite a borrowed, non-append read/write handle with best-effort failure rollback. */
export declare function overwriteFileHandle(handle: FileHandle, data: Uint8Array, options?: OverwriteFileHandleOptions): Promise<void>;
