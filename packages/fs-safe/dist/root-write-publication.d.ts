import { type BigIntStats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import type { AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { RootContext } from "./root-context.js";
import type { RootWriteOptions } from "./root-options.js";
export declare function finishRootFallbackWrite(params: {
    root: RootContext;
    targetPath: string;
    handle: FileHandle;
    identity: BigIntStats;
    parentGuard: AnyAsyncDirectoryGuard;
    mode: number;
    options: RootWriteOptions & {
        data: string | Buffer;
    };
    openForCompatibility: () => Promise<{
        opened: {
            handle: FileHandle;
        };
        identity: BigIntStats;
    }>;
    onVerificationFailure: (error: unknown) => void;
}): Promise<void>;
