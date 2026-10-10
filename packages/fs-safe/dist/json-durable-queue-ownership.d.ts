import { type BigIntStats } from "node:fs";
export type DurableQueueEntryPathsLike = {
    jsonPath: string;
    deliveredPath: string;
    processingPath?: string;
};
export type ValidatedDurableQueueEntryPaths = Readonly<Required<DurableQueueEntryPathsLike>>;
export declare function validateDurableQueueEntryPaths(paths: DurableQueueEntryPathsLike): ValidatedDurableQueueEntryPaths;
export declare function claimDurableQueueEntry(paths: DurableQueueEntryPathsLike, options?: {
    skipUnowned?: boolean;
}): Promise<string | null>;
export declare function migrateDurableQueueEntry<T>(paths: DurableQueueEntryPathsLike, expected: BigIntStats, releaseReadPin: () => Promise<void>, run: (filePath: string, beforePublish: () => Promise<void>) => Promise<T>): Promise<T>;
export declare function completeDeliveredQueueEntry(paths: DurableQueueEntryPathsLike): Promise<boolean>;
export declare function acknowledgeDurableQueueEntry(paths: DurableQueueEntryPathsLike): Promise<void>;
export declare function moveDurableQueueEntryToFailed(params: {
    paths: DurableQueueEntryPathsLike;
    failedPath: string;
}): Promise<void>;
export declare function getErrorCode(error: unknown): string | null;
