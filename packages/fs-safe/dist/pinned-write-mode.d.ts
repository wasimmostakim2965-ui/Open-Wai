import type { FileHandle } from "node:fs/promises";
export declare function assertPinnedWriteMode(fd: number, mode: number, privateCreation?: boolean): void;
export declare function preparePinnedWriteMode(handle: FileHandle, createdMode: number, assertBeforeMutation?: () => void, privateCreation?: boolean): Promise<(() => void) | undefined>;
export declare function pinnedWriteModeAssertion(fd: number, mode: number, assertBeforeMutation?: () => void, privateCreation?: boolean): () => void;
