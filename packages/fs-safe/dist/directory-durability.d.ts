import { type BigIntStats, type Stats } from "node:fs";
import type { FileIdentityStat } from "./file-identity.js";
export type DirectorySyncOutcome = {
    status: "synced";
} | {
    status: "unsupported";
    code?: string;
};
export type DirectoryReceipt<T extends Stats | BigIntStats = Stats> = {
    path: string;
    realPath: string;
    identity: T;
};
export type DurableDirectoryReceipt = DirectoryReceipt & {
    parentSync: DirectorySyncOutcome | {
        status: "not-needed";
    };
};
export type PinnedDirectory = {
    readonly receipt: DirectoryReceipt;
    assertCurrent(): Promise<void>;
    sync(): Promise<DirectorySyncOutcome>;
    close(): Promise<void>;
};
export type EnsureDurableDirectoryOptions = {
    directoryPath: string;
    label?: string;
    mode?: number;
    expectedExistingIdentity?: FileIdentityStat;
    create?: (directoryPath: string) => Promise<void>;
};
export declare function pinDirectory(directory: string | DirectoryReceipt<Stats | BigIntStats>, options?: {
    label?: string;
}): Promise<PinnedDirectory>;
export declare function syncDirectory(directory: string | DirectoryReceipt<Stats | BigIntStats>, options?: {
    label?: string;
}): Promise<DirectorySyncOutcome>;
export declare function syncDirectorySync(directory: string | DirectoryReceipt<Stats | BigIntStats>, options?: {
    label?: string;
}): DirectorySyncOutcome;
export declare function syncDirectoryBestEffort(directoryPath: string): Promise<void>;
export declare function syncDirectoryBestEffortSync(directoryPath: string): void;
export declare function ensureDurableDirectory(options: EnsureDurableDirectoryOptions): Promise<DurableDirectoryReceipt>;
