import type { BigIntStats, Stats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import { type RootContext } from "./root-context.js";
import type { RootPathDirectoryObservationGuard, RootPathObservationReceipt, RootPathParentObservationReceipt } from "./root-path.js";
import type { DirEntry, PathStat } from "./types.js";
import type { RootDirectoryListing, RootDirectoryListingOptions } from "./root-directory-list-types.js";
export declare function pathStatFromStats(stat: Stats | BigIntStats): PathStat;
export declare function pathStatFromStats(stat: Stats | BigIntStats, name: string): DirEntry;
export type RootDirectoryObservationGuard = AsyncDirectoryGuard<BigIntStats>;
export declare function createRootDirectoryObservationGuard(root: RootContext, directory: string): Promise<RootDirectoryObservationGuard>;
export declare function assertRootDirectoryObservationGuard(root: RootContext, guard: RootDirectoryObservationGuard | RootPathDirectoryObservationGuard): Promise<void>;
/**
 * Close an operation-local traversal receipt with fresh exact observations.
 * Descendant canonical paths are admitted while the receipt is created. The
 * final directory check repeats canonical admission; the Root-only case does
 * both its identity and canonical check here.
 */
export declare function assertRootPathObservationReceiptCurrent(root: RootContext, receipt: RootPathObservationReceipt | RootPathParentObservationReceipt, finalTarget?: Stats | BigIntStats): void;
export declare function listDirectoryPath(root: RootContext, directory: string, withFileTypes: true, receipt?: RootPathObservationReceipt): Promise<DirEntry[]>;
export declare function listDirectoryPath(root: RootContext, directory: string, withFileTypes: boolean, receipt?: RootPathObservationReceipt): Promise<string[] | DirEntry[]>;
export declare function openRootDirectoryListing(root: RootContext, directory: string, options: RootDirectoryListingOptions, receipt?: RootPathObservationReceipt): Promise<RootDirectoryListing>;
