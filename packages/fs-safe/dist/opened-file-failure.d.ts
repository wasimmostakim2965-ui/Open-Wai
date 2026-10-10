import { type BigIntStats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
export declare function recordFileOpenFailure(error: unknown, filePath: string): never;
export declare function recordExclusiveCreateFailure(error: unknown, filePath: string): never;
export declare function openedPathResolutionError(error?: Error): Error;
export declare function recordPreOpenFileChange(error: unknown, handle: FileHandle, filePath: string, before: BigIntStats | undefined, opened: BigIntStats | undefined): Promise<void>;
export declare function recordOpenedFileFailure(error: unknown, handle: FileHandle, filePath: string, identity: BigIntStats): Promise<void>;
