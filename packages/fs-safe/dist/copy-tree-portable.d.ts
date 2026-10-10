import type { NativeBinding } from "./native-binding.js";
import { openStagedDirectory } from "./staged-directory.js";
/** Byte-copy adapter for the shared immutable-source, caller-owned namespace contract. */
export declare function copyOwnedTree(source: ReturnType<typeof openStagedDirectory>, destination: string, options: {
    signal?: AbortSignal;
    concurrency: number;
    copyFileContents?: NativeBinding["copyFileContents"];
}): Promise<void>;
