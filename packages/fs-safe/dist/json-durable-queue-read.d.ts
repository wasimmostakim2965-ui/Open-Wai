import { type BigIntStats } from "node:fs";
export declare const DEFAULT_JSON_DURABLE_QUEUE_ENTRY_MAX_BYTES: number;
export declare function withJsonDurableQueueEntry<T, R>(filePath: string, options: {
    maxBytes?: number;
}, run: (entry: T, identity: BigIntStats, releaseReadPin: () => Promise<void>) => Promise<R>): Promise<R>;
