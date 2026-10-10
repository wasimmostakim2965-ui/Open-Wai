import { type ReplaceFileAtomicOptions } from "./replace-file.js";
export type WriteTextAtomicOptions = Pick<ReplaceFileAtomicOptions, "beforeRename" | "tempPrefix"> & {
    mode?: number;
    dirMode?: number;
    trailingNewline?: boolean;
    /** Defaults to true; false skips file and parent fsync without changing replacement. */
    durable?: boolean;
};
export declare function writeTextAtomic(filePath: string, content: string, options?: WriteTextAtomicOptions): Promise<void>;
