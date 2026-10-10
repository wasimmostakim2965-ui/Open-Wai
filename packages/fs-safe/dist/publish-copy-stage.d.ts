import { type BigIntStats } from "node:fs";
import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { PublishedWriteIdentity } from "./pinned-write-types.js";
export declare function publishCopyStage(params: {
    temporaryPath: string;
    targetPath: string;
    fd: number;
    identity: BigIntStats;
    parentGuard: AnyAsyncDirectoryGuard;
    assertBeforeMutation?: () => void;
    onPublicationAttempt?: () => void;
    onPublished?: (identity: PublishedWriteIdentity) => void;
}): void;
