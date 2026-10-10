import syncFs, { type BigIntStats, type Stats } from "node:fs";
import fs, { type FileHandle } from "node:fs/promises";
export type Procedure<T> = Generator<unknown, T, unknown>;
type SyncFchmod = (fd: number, mode: number) => void;
type AsyncAtomicFileSystem = Partial<Pick<typeof fs, "open" | "lstat" | "mkdir" | "rename" | "rm" | "unlink" | "writeFile">>;
type SyncAtomicFileSystem = Partial<Pick<typeof syncFs, "openSync" | "lstatSync" | "mkdirSync" | "renameSync" | "rmSync" | "unlinkSync" | "fstatSync" | "closeSync" | "fsyncSync" | "writeFileSync" | "readFileSync" | "readSync" | "writeSync" | "ftruncateSync">>;
export declare function wait<T>(value: T | PromiseLike<T>): Procedure<T>;
export declare function runAsync<T>(procedure: Procedure<T>): Promise<T>;
export declare function runSync<T>(procedure: Procedure<T>): T;
export declare function inspectAtomicIdentity<T extends Pick<BigIntStats, "dev" | "ino">>(io: AtomicIo, read: () => T | Promise<T>, expected?: Pick<BigIntStats, "dev" | "ino">, synchronous?: boolean, admit?: (stat: T) => void): T | Promise<T>;
/** One adapter per operation; each admitted descriptor receives one AtomicFile. */
export declare class AtomicIo {
    readonly asyncFs: AsyncAtomicFileSystem | undefined;
    readonly syncFs: SyncAtomicFileSystem | undefined;
    fchmodSync?: SyncFchmod | undefined;
    readonly asynchronous: boolean;
    private constructor();
    static async(fsModule: AsyncAtomicFileSystem): AtomicIo;
    static sync(fsModule: SyncAtomicFileSystem, fchmodSync?: SyncFchmod): AtomicIo;
    wrap(resource: FileHandle | number): AtomicFile;
    open(pathname: string, flags: string | number, mode?: number): Procedure<AtomicFile>;
    lstat(pathname: string): Procedure<Stats>;
    lstatExact(pathname: string, synchronousBuiltin?: boolean): BigIntStats | Promise<BigIntStats>;
    mkdir(directory: string, mode: number): Procedure<void>;
    rename(source: string, destination: string): Procedure<void>;
    remove(pathname: string): Procedure<void>;
    unlink(pathname: string): Procedure<void>;
    delay(milliseconds: number): Procedure<void>;
}
export declare class AtomicFile {
    readonly io: AtomicIo;
    readonly resource: FileHandle | number;
    constructor(io: AtomicIo, resource: FileHandle | number);
    get fd(): number;
    stat(): Procedure<Stats>;
    statExact(): BigIntStats | Promise<BigIntStats>;
    close(): void | Promise<void>;
    sync(): Procedure<void>;
    syncBestEffort(): Procedure<void>;
    chmod(mode: number): void | Promise<void>;
    writeFile(data: string | Uint8Array, throughModule?: boolean): void | Promise<void>;
    readFile(sizeHint?: number): Procedure<Buffer>;
    read(buffer: Buffer, offset: number, length: number, position: number | null): number | Promise<{
        bytesRead: number;
    }>;
    write(buffer: Buffer, offset: number, length: number, position: number | null): number | Promise<{
        bytesWritten: number;
    }>;
    truncate(length: number): Procedure<void>;
}
export {};
