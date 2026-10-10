import type { BigIntStats, Stats } from "node:fs";
import type { PermissionCheck } from "./permissions.js";
type ExactIdentity = Pick<BigIntStats, "dev" | "ino">;
/** Both mechanisms inspect the same borrowed handle; the caller owns its lifetime. */
export declare function inspectSecureWindowsFile(params: {
    fd: number;
    identity: ExactIdentity;
    stat: Stats;
}): Promise<PermissionCheck>;
export {};
