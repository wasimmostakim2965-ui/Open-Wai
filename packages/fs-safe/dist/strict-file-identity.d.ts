import type { BigIntStats } from "node:fs";
import { FsSafeError } from "./errors.js";
type ExactFileIdentity = Pick<BigIntStats, "dev" | "ino">;
export declare function fileIdentityMismatchError(): FsSafeError;
export declare function inspectFileIdentity<T extends ExactFileIdentity>(inspect: () => T | Promise<T>, expected?: ExactFileIdentity, platform?: NodeJS.Platform): Promise<T>;
export declare function inspectFileIdentitySync<T extends ExactFileIdentity>(inspect: () => T, expected?: ExactFileIdentity, platform?: NodeJS.Platform, mismatch?: () => Error): T;
export {};
