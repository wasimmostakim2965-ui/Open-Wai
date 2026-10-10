import { type OwnerAndDaclResult } from "./owner-dacl.js";
/** Inspect an ordered batch outside the caller's event loop, without applying trust policy. */
export declare function readOwnerAndDaclBatch(paths: readonly string[], options?: {
    timeoutMs?: number;
}): Promise<OwnerAndDaclResult[]>;
