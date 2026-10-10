import type { BigIntStats } from "node:fs";
import { type AtomicIo, type Procedure } from "./atomic-io.js";
export declare function readOwnedCopySource(io: AtomicIo, params: {
    src: string;
    expectedIdentity?: BigIntStats;
}): Procedure<{
    replacement: Buffer;
    mode: number;
}>;
