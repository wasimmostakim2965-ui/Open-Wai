import { type BigIntStats } from "node:fs";
import { type AtomicFile, type AtomicIo, type Procedure } from "./atomic-io.js";
export type AtomicTempFailure = Readonly<{
    error: unknown;
}>;
export declare function removePathIfIdentityUnchanged(targetPath: string, identity: Pick<BigIntStats, "dev" | "ino">): Promise<void>;
export declare class AtomicTempOwner {
    readonly pathname: string;
    private readonly io;
    private resource;
    private recordedIdentity;
    private exists;
    private readonly unregister;
    constructor(pathname: string, io: AtomicIo);
    start(): void;
    readonly onIdentity: (identity: BigIntStats) => void;
    get identity(): BigIntStats;
    markRenamed(): void;
    private takeResource;
    adopt(temp: {
        file: AtomicFile;
        identity: BigIntStats;
    }): void;
    private inspectOwned;
    assertCurrent(pathname?: string): Procedure<void>;
    assertPublished(pathname: string, expectedHash?: string, onVerified?: (identity: BigIntStats) => void): Procedure<void>;
    private cleanupOwnedPath;
    finish(params: {
        originalFailure?: AtomicTempFailure;
        throwOnCleanupError: boolean;
    }): Procedure<void>;
}
