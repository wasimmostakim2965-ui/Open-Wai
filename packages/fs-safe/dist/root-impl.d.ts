import type { BigIntStats, Stats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import type { ContainmentGuarantee } from "./containment.js";
import { type ReadResult } from "./read-opened-file.js";
import { type RootEntriesOptions } from "./root-entries.js";
import { type RootContext } from "./root-context.js";
import type { DirEntry, PathStat } from "./types.js";
import { type RootWalkEntry, type RootWalkOptions, type RootWalkSymlinkPolicy } from "./root-walk.js";
import { type RootAppendOptions, type RootCopyOptions, type RootCopySource, type RootCreateJsonOptions, type RootCreateOptions, type RootCreateStreamOptions, type RootDefaults, type RootMkdirOptions, type RootMoveOptions, type RootOpenOptions, type RootOpenWritableOptions, type RootReadOptions, type RootRemoveOptions, type RootWriteJsonOptions, type RootWriteOptions } from "./root-options.js";
export { DEFAULT_ROOT_MAX_BYTES } from "./root-options.js";
export { resolveOpenedFileRealPathForHandle } from "./opened-realpath.js";
export type OpenResult = {
    handle: FileHandle;
    containment: ContainmentGuarantee;
    realPath: string;
    stat: Stats;
    [Symbol.asyncDispose](): Promise<void>;
};
export interface Root {
    readonly rootDir: string;
    readonly rootReal: string;
    readonly rootWithSep: string;
    readonly defaults: RootDefaults;
    resolve(relativePath: string): Promise<string>;
    open(relativePath: string, options?: RootOpenOptions): Promise<OpenResult>;
    read(relativePath: string, options?: RootReadOptions): Promise<ReadResult>;
    readBytes(relativePath: string, options?: RootReadOptions): Promise<Buffer>;
    readText(relativePath: string, options?: RootReadOptions & {
        encoding?: BufferEncoding;
    }): Promise<string>;
    readJson<T = unknown>(relativePath: string, options?: RootReadOptions & {
        encoding?: BufferEncoding;
    }): Promise<T>;
    readAbsolute(filePath: string, options?: RootReadOptions): Promise<ReadResult>;
    reader(options?: RootReadOptions): (filePath: string) => Promise<Buffer>;
    openWritable(relativePath: string, options?: RootOpenWritableOptions): Promise<WritableOpenResult>;
    append(relativePath: string, data: string | Buffer, options?: RootAppendOptions): Promise<void>;
    remove(relativePath: string, options?: RootRemoveOptions): Promise<void>;
    mkdir(relativePath: string, options?: RootMkdirOptions): Promise<void>;
    ensureRoot(options?: RootMkdirOptions): Promise<void>;
    write(relativePath: string, data: string | Buffer, options?: RootWriteOptions): Promise<void>;
    create(relativePath: string, data: string | Buffer, options?: RootCreateOptions): Promise<void>;
    create(relativePath: string, data: AsyncIterable<Uint8Array>, options?: RootCreateStreamOptions): Promise<void>;
    writeJson(relativePath: string, data: unknown, options?: RootWriteJsonOptions): Promise<void>;
    createJson(relativePath: string, data: unknown, options?: RootCreateJsonOptions): Promise<void>;
    copyIn(relativePath: string, source: RootCopySource, options?: RootCopyOptions): Promise<void>;
    exists(relativePath: string): Promise<boolean>;
    stat(relativePath: string): Promise<PathStat>;
    list(relativePath: string, options?: {
        withFileTypes?: false;
    }): Promise<string[]>;
    list(relativePath: string, options: {
        withFileTypes: true;
    }): Promise<DirEntry[]>;
    entries(relativePath: string, options?: RootEntriesOptions): AsyncIterableIterator<DirEntry>;
    move(fromRelative: string, toRelative: string, options?: RootMoveOptions): Promise<void>;
    walk<Policy extends RootWalkSymlinkPolicy>(relativePath: string, options: RootWalkOptions<Policy>): AsyncIterableIterator<RootWalkEntry<Policy>>;
}
export declare class RootHandle implements Root {
    private readonly context;
    readonly rootDir: string;
    readonly rootReal: string;
    readonly rootWithSep: string;
    readonly defaults: RootDefaults;
    constructor(context: RootContext, defaults?: RootDefaults);
    private mutationOptions;
    resolve(relativePath: string): Promise<string>;
    open(relativePath: string, options?: RootOpenOptions): Promise<OpenResult>;
    read(relativePath: string, options?: RootReadOptions): Promise<ReadResult>;
    readBytes(relativePath: string, options?: RootReadOptions): Promise<Buffer>;
    readText(relativePath: string, options?: RootReadOptions & {
        encoding?: BufferEncoding;
    }): Promise<string>;
    readJson<T = unknown>(relativePath: string, options?: RootReadOptions & {
        encoding?: BufferEncoding;
    }): Promise<T>;
    readAbsolute(filePath: string, options?: RootReadOptions): Promise<ReadResult>;
    reader(options?: RootReadOptions): (filePath: string) => Promise<Buffer>;
    openWritable(relativePath: string, options?: RootOpenWritableOptions): Promise<WritableOpenResult>;
    append(relativePath: string, data: string | Buffer, options?: RootAppendOptions): Promise<void>;
    remove(relativePath: string, options?: RootRemoveOptions): Promise<void>;
    mkdir(relativePath: string, options?: RootMkdirOptions): Promise<void>;
    ensureRoot(options?: RootMkdirOptions): Promise<void>;
    write(relativePath: string, data: string | Buffer, options?: RootWriteOptions): Promise<void>;
    create(relativePath: string, data: string | Buffer, options?: RootCreateOptions): Promise<void>;
    create(relativePath: string, data: AsyncIterable<Uint8Array>, options?: RootCreateStreamOptions): Promise<void>;
    writeJson(relativePath: string, data: unknown, options?: RootWriteJsonOptions): Promise<void>;
    createJson(relativePath: string, data: unknown, options?: RootCreateJsonOptions): Promise<void>;
    copyIn(relativePath: string, source: RootCopySource, options?: RootCopyOptions): Promise<void>;
    exists(relativePath: string): Promise<boolean>;
    stat(relativePath: string): Promise<PathStat>;
    list(relativePath: string, options?: {
        withFileTypes?: false;
    }): Promise<string[]>;
    list(relativePath: string, options: {
        withFileTypes: true;
    }): Promise<DirEntry[]>;
    move(fromRelative: string, toRelative: string, options?: RootMoveOptions): Promise<void>;
    entries(relativePath: string, options?: RootEntriesOptions): AsyncIterableIterator<DirEntry>;
    walk<Policy extends RootWalkSymlinkPolicy>(relativePath: string, options: RootWalkOptions<Policy>): AsyncIterableIterator<RootWalkEntry<Policy>>;
}
export declare function root(rootDir: string, defaults?: RootDefaults): Promise<Root>;
export declare function rootFromDirectoryGuard(guard: {
    readonly dir: string;
    readonly realPath: string;
    readonly stat: BigIntStats;
}, defaults?: RootDefaults): Root;
export declare function readLocalFileSafely(params: {
    filePath: string;
    maxBytes?: number;
}): Promise<ReadResult>;
export declare function openLocalFileSafely(params: {
    filePath: string;
}): Promise<OpenResult>;
export type WritableOpenResult = OpenResult & {
    createdForWrite: boolean;
};
