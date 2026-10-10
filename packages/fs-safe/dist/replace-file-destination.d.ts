import type { BigIntStats } from "node:fs";
import { type AtomicFile, type AtomicIo, type Procedure } from "./atomic-io.js";
import type { AtomicMutation } from "./replace-file-mutation.js";
/** Borrows the writer's descriptor; no later pathname open can replace it. */
export declare class AtomicDestination {
    #private;
    readonly io: AtomicIo;
    readonly file: AtomicFile;
    readonly pathname: string;
    readonly mutation: AtomicMutation;
    readonly rejectHardlinks: boolean;
    readonly identity: BigIntStats;
    constructor(io: AtomicIo, file: AtomicFile, pathname: string, mutation: AtomicMutation, rejectHardlinks: boolean, identity: BigIntStats);
    verify(restore?: boolean): Procedure<void>;
    beforeWrite(restore: boolean): Procedure<void>;
    writing(): void;
    published(): void;
}
export declare function captureAtomicDestination(io: AtomicIo, file: AtomicFile, pathname: string, mutation: AtomicMutation, rejectHardlinks: boolean): Procedure<AtomicDestination>;
