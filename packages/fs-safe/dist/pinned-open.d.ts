import fs from "node:fs";
export type PinnedOpenSyncFailureReason = "path" | "validation" | "io";
export type PinnedOpenSyncResult = {
    ok: true;
    path: string;
    fd: number;
    stat: fs.Stats;
    identity: fs.BigIntStats;
} | {
    ok: false;
    reason: PinnedOpenSyncFailureReason;
    error?: unknown;
};
export type PinnedOpenSyncAllowedType = "file" | "directory";
export type PinnedOpenSyncFinalAdmission = (params: {
    path: string;
    descriptorIdentity: fs.BigIntStats;
}) => string;
export type PinnedOpenSyncFs = Pick<typeof fs, "constants" | "lstatSync" | "realpathSync" | "openSync" | "fstatSync" | "closeSync">;
export declare function isExpectedPathError(error: unknown): boolean;
export declare function openPinnedFileSync(params: {
    filePath: string;
    resolvedPath?: string;
    rejectPathSymlink?: boolean;
    rejectHardlinks?: boolean;
    maxBytes?: number;
    allowedType?: PinnedOpenSyncAllowedType;
    ioFs?: PinnedOpenSyncFs;
    finalAdmission?: PinnedOpenSyncFinalAdmission;
}): PinnedOpenSyncResult;
