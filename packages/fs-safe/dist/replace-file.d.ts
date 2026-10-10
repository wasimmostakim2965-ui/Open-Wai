import type { ReplaceFileAtomicOptions, ReplaceFileAtomicSyncOptions, ReplaceFileAtomicResult } from "./replace-file-types.js";
export type { ReplaceFileAtomicDestinationState } from "./replace-file-mutation.js";
export type { ReplaceFileAtomicFileSystem, ReplaceFileAtomicSyncFileSystem, ReplaceFileAtomicOptions, ReplaceFileAtomicSyncOptions, ReplaceFileAtomicResult, } from "./replace-file-types.js";
export declare function replaceFileAtomic(options: ReplaceFileAtomicOptions): Promise<ReplaceFileAtomicResult>;
export declare function replaceFileAtomicWithDirectorySync(options: ReplaceFileAtomicOptions, syncParent?: (directoryPath: string) => Promise<unknown>): Promise<ReplaceFileAtomicResult>;
export declare function replaceFileAtomicSync(options: ReplaceFileAtomicSyncOptions): ReplaceFileAtomicResult;
