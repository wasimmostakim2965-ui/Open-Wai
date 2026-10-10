import fs from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import { type PinnedMutationPolicySnapshot } from "./pinned-mutation-admission.js";
import { type RootContext } from "./root-context.js";
import type { RootWritePathSelection, RetainedRootWriteSelection } from "./root-write-admission.js";
import type { WritableOpenResult } from "./root-impl.js";
import type { RootOpenWritableOptions } from "./root-options.js";
export type OpenedWritableFileInRoot = {
    opened: WritableOpenResult;
    identity: fs.BigIntStats;
    writeSelection?: RetainedRootWriteSelection;
    cleanupCreated?: () => Promise<void>;
    releaseCreationParent?: () => void;
};
export type WritableFileInRootParams = Omit<RootOpenWritableOptions, "writeMode"> & {
    relativePath: string;
    truncateExisting?: boolean;
    append?: boolean;
    expectedWritePath?: string;
    keepCreationParent?: boolean;
};
export declare function rootWriteQueueKey(root: RootContext, relativePath: string): string;
export declare function buildAtomicWriteTempPath(targetPath: string): string;
export type MissingWritableFileInRoot = {
    missing: true;
    targetPath: string;
    parentGuard: AnyAsyncDirectoryGuard;
    writeSelection?: RootWritePathSelection;
};
type Creation = {
    root: RootContext;
    directory: string;
    target: string;
    mkdir: boolean;
    private?: boolean;
    policy?: PinnedMutationPolicySnapshot;
    resolveCurrent(): Promise<string>;
    assertBeforeMutation?: () => void;
    originalPath?: string;
};
export declare function tryMkdirRootNative(params: Creation): Promise<boolean>;
export declare function tryOpenCreateRootNative(params: Creation & {
    flags: number;
    existingFlags: number;
    mode: number;
}): Promise<{
    handle: FileHandle;
    cleanupCreated(): Promise<void>;
    releaseCreationParent(): void;
}>;
export {};
