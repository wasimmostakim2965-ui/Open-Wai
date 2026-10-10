import { type BigIntStats } from "node:fs";
import { type AnyAsyncDirectoryGuard, type SyncDirectoryGuard } from "./directory-guard.js";
export declare function withAsyncDirectoryGuards<T>(guards: readonly AnyAsyncDirectoryGuard[], mutate: () => Promise<T>, options?: {
    verifyAfter?: boolean;
    onPostGuardFailure?: (result: T, error: unknown) => Promise<void> | void;
}): Promise<T>;
export declare function withSyncDirectoryGuards<T>(guards: readonly SyncDirectoryGuard[], mutate: () => T, options?: {
    verifyAfter?: boolean;
}): T;
export declare function guardedRename(params: {
    assertBeforeRename?: () => void;
    onSourceInspected?: (identity: Pick<BigIntStats, "dev" | "ino">) => void;
    onRenamed?: () => void;
    from: string;
    to: string;
}): Promise<void>;
export declare function guardedRenameSync(params: {
    from: string;
    to: string;
}): void;
export declare function guardedRm(params: {
    target: string;
    assertBeforeMutation?: () => void;
    recursive?: boolean;
}): Promise<void>;
export declare function guardedRmSync(params: {
    target: string;
    assertBeforeMutation?: () => void;
    recursive?: boolean;
    force?: boolean;
    verifyAfter?: boolean;
}): void;
