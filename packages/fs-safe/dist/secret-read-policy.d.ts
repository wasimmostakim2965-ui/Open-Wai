import { type BigIntStats } from "node:fs";
import { FsSafeError, type FsSafeErrorCode } from "./errors.js";
export declare const DEFAULT_SECRET_FILE_MAX_BYTES: number;
export type SecretFileReadOptions = {
    maxBytes?: number;
    rejectSymlink?: boolean;
    rejectHardlinks?: boolean;
};
export declare function secretPathErrorCode(error: unknown): FsSafeErrorCode;
export declare function secretReadError(code: FsSafeErrorCode, action: "inspect" | "read", label: string, resolvedPath: string, error: unknown): FsSafeError;
export declare function assertSecretFilePreview(stat: BigIntStats, label: string, resolvedPath: string, maxBytes: number, rejectHardlinks: boolean): void;
export declare function trimSecretFileContent(raw: string, label: string, resolvedPath: string): string;
export declare function prepareSecretRead(filePath: string, label: string, options: SecretFileReadOptions): {
    resolvedPath: string;
    maxBytes: number;
    rejectSymlink: boolean;
    rejectHardlinks: boolean;
    previewStat: BigIntStats;
    inspectInput: (symlinkMessage: string) => BigIntStats;
};
