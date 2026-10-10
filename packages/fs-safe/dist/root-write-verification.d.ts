import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { PublishedWriteIdentity } from "./pinned-write-types.js";
import { type RootContext } from "./root-context.js";
export declare function verifyAtomicWriteResult(params: {
    root: RootContext;
    targetPath: string;
    fd: number;
    expectedIdentity: PublishedWriteIdentity;
    expectedMode?: number;
    parentGuard: AnyAsyncDirectoryGuard;
}): Promise<void>;
