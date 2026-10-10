import { type FsSafeLockConfig } from "./lock-config.js";
import type { Root } from "./root.js";
export type JsonStoreLockOptions = Partial<FsSafeLockConfig & {
    managerKey: string;
}>;
export type JsonFileStoreOptions = {
    /** Overrides the parent store's durability for every JSON mutation. */
    durable?: boolean;
    trailingNewline?: boolean;
    lock?: boolean | JsonStoreLockOptions;
};
export type JsonStore<T> = {
    readonly filePath: string;
    read(): Promise<T | undefined>;
    readOr(fallback: T): Promise<T>;
    readRequired(): Promise<T>;
    write(value: T): Promise<void>;
    update(run: (current: T | undefined) => T | Promise<T>): Promise<T>;
    updateOr(fallback: T, run: (current: T) => T | Promise<T>): Promise<T>;
};
export type JsonStoreAdapter<T> = {
    filePath: string;
    /** Internal admission before lock I/O, within the serialized mutation. */
    prepareLock?: () => Promise<Root>;
    readIfExists(): Promise<T | undefined>;
    readRequired(): Promise<T>;
    write(value: T, options?: {
        trailingNewline?: boolean;
        durable?: boolean;
    }): Promise<void>;
};
export declare function createJsonStore<T>(adapter: JsonStoreAdapter<T>, options?: JsonFileStoreOptions): JsonStore<T>;
