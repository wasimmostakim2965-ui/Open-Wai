import { type BigIntStats } from "node:fs";
type StoreMessagePrefix = "private store" | "store";
export type SyncStoreDirectoryReceipt = Readonly<{
    dir: string;
    realPath: string;
    exactStat: BigIntStats;
}>;
export declare function ensureSyncStoreDirectory(params: {
    rootDir: string;
    targetDir: string;
    mode: number;
    messagePrefix: StoreMessagePrefix;
}): SyncStoreDirectoryReceipt;
export declare function assertSyncStoreDirectoryReceipt(receipt: SyncStoreDirectoryReceipt): void;
export {};
