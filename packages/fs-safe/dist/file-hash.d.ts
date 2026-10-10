import type { FileHandle } from "node:fs/promises";
import { type NativeBinding } from "./native.js";
export type Sha256FileInput = string | FileHandle;
export type Sha256FileSyncInput = string | number;
export type Sha256FileOptions = {
    maxBytes?: number;
    signal?: AbortSignal;
};
export type Sha256FileResult = {
    bytes: number;
    digest: string;
};
export declare function hashFileHandle(handle: FileHandle, native?: NativeBinding | undefined, { maxBytes, signal }?: Sha256FileOptions): Promise<Sha256FileResult>;
export declare function sha256File(input: Sha256FileInput, options?: Sha256FileOptions): Promise<Sha256FileResult>;
/** Hash synchronously from offset zero, retaining ownership and position of a borrowed fd. */
export declare function sha256FileSync(input: Sha256FileSyncInput, options?: Sha256FileOptions): Sha256FileResult;
