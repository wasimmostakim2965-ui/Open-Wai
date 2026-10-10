import type { BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import { FsSafeError } from "./errors.js";
import type { RootContext } from "./root-context.js";
import type { GuardedRootWriteTarget } from "./root-write-admission.js";
type PreparedWriteTargetObservation = Readonly<{
    exists: false;
} | {
    exists: true;
    stat: BigIntStats;
}>;
/**
 * Exact, operation-local evidence that an ordinary shared-JavaScript write
 * already has a complete parent. Path selection consumes this instead of
 * recapturing the same parent after a component walk.
 */
export type PreparedRootWriteParent = Readonly<{
    operationTargetPath: string;
    selectedTargetPath: string;
    parentGuard: AsyncDirectoryGuard<BigIntStats>;
    rootPath: string;
    rootIdentity: Readonly<{
        dev: bigint;
        ino: bigint;
    }>;
    nativeMode: string;
    target: PreparedWriteTargetObservation;
}>;
type SharedRootWriteTargetParams = Readonly<{
    relativePath: string;
    guardedTarget: GuardedRootWriteTarget;
    mkdir?: boolean;
    assertBeforeMutation?: () => void;
}>;
export type SharedRootWriteTarget = Readonly<{
    targetPath: string;
    mutationAdmission: GuardedRootWriteTarget["mutationAdmission"];
    preparedParent?: PreparedRootWriteParent;
}>;
export declare function writeSelectionChanged(cause?: unknown): FsSafeError;
export declare function assertPreparedRootWriteParentCurrent(prepared: PreparedRootWriteParent, verifyTarget?: boolean): void;
export declare function prepareSharedRootWriteTarget(root: RootContext, params: SharedRootWriteTargetParams): Promise<SharedRootWriteTarget>;
export {};
