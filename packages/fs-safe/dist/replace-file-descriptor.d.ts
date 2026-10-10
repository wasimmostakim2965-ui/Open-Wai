import { type BigIntStats } from "node:fs";
import type { AtomicMutation } from "./replace-file-mutation.js";
import { type AtomicFile, type AtomicIo, type Procedure } from "./atomic-io.js";
export declare function syncDirectoryBestEffort(io: AtomicIo, dirPath: string): Procedure<void>;
export declare function applyDirectoryMode(io: AtomicIo, params: {
    dirPath: string;
    mode: number;
    ignoreChmodError?: boolean;
    mutation?: AtomicMutation;
}): Procedure<void>;
export declare function writeTempFile(io: AtomicIo, params: {
    tempPath: string;
    content: string | Uint8Array;
    mode: number;
    sync: boolean;
    onIdentity?: (identity: BigIntStats) => void;
    mutation?: AtomicMutation;
}): Procedure<{
    file: AtomicFile;
    identity: BigIntStats;
}>;
