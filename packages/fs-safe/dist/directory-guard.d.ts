import type { BigIntStats, Stats } from "node:fs";
import { type ExactStatIdentity, type StatObservationReceipt } from "./stat-observation.js";
export type AsyncDirectoryGuard<T extends Stats | BigIntStats = Stats> = {
    dir: string;
    realPath: string;
    stat: T;
};
export type AnyAsyncDirectoryGuard = AsyncDirectoryGuard<Stats | BigIntStats>;
export type SyncDirectoryGuard = AsyncDirectoryGuard;
type DirectoryGuardMode = "native" | "normalized";
type DirectoryGuardOptions = {
    bigint?: boolean;
    initial?: BigIntStats;
};
export type DirectoryIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
    realPath: string;
}>;
export declare function readDirectoryIdentity(dir: string): Promise<DirectoryIdentity>;
export declare function assertDirectoryIdentitySync(observedPath: string, expected: Pick<DirectoryIdentity, "dev" | "ino"> & {
    realPath?: string;
}): void;
export declare function createAsyncDirectoryGuard(dir: string, options: {
    bigint: true;
    initial?: BigIntStats;
}): Promise<AsyncDirectoryGuard<BigIntStats>>;
export declare function createAsyncDirectoryGuard(dir: string, options?: {
    bigint?: false;
}): Promise<AsyncDirectoryGuard>;
export declare function createAsyncDirectoryGuard(dir: string, options: {
    bigint: boolean;
}): Promise<AnyAsyncDirectoryGuard>;
export declare function createSyncDirectoryGuard(dir: string): SyncDirectoryGuard;
export declare function captureDirectoryGuard(dir: string, mode: DirectoryGuardMode, options?: {
    bigint?: false;
}): SyncDirectoryGuard;
export declare function captureDirectoryGuard(dir: string, mode: DirectoryGuardMode, options?: DirectoryGuardOptions): AnyAsyncDirectoryGuard;
export declare function assertAsyncDirectoryGuard(guard: AnyAsyncDirectoryGuard): Promise<void>;
export declare function assertSyncDirectoryGuard(guard: SyncDirectoryGuard | AnyAsyncDirectoryGuard): void;
export declare function assertDirectoryGuard(guard: AnyAsyncDirectoryGuard, mode: DirectoryGuardMode): void;
export declare function createNearestExistingDirectoryGuard(rootReal: string, targetPath: string): Promise<AsyncDirectoryGuard>;
export declare function createNearestExistingDirectoryGuard(rootReal: string, targetPath: string, options: {
    bigint: true;
}): Promise<AsyncDirectoryGuard<BigIntStats>>;
export declare function createNearestExistingDirectoryGuard(rootReal: string, targetPath: string, options: {
    bigint: boolean;
}): Promise<AnyAsyncDirectoryGuard>;
export declare function inspectDirectoryIdentity(dir: string, expected?: Pick<BigIntStats, "dev" | "ino">): Promise<BigIntStats>;
export declare function observeDirectoryIdentitySync(dir: string, options: {
    bigint: true;
}): BigIntStats;
export declare function observeDirectoryIdentitySync(dir: string, options?: {
    bigint?: false;
}): Stats;
export declare function inspectDirectoryIdentitySync(dir: string, expected?: Pick<BigIntStats, "dev" | "ino">, initial?: BigIntStats, platform?: NodeJS.Platform): BigIntStats;
export type DirectoryObservationGuard = StatObservationReceipt & {
    dir: string;
    realPath: string;
};
export declare function extendDirectoryObservationGuard(observation: StatObservationReceipt, dir: string, realPath: string): DirectoryObservationGuard;
export declare function inspectDirectoryObservationSync(dir: string, expected?: ExactStatIdentity): StatObservationReceipt;
export declare function assertDirectoryObservationSync(dir: string, expected: ExactStatIdentity): Stats | BigIntStats;
export declare function assertDirectoryObservationGuardSync(guard: DirectoryObservationGuard): void;
export {};
