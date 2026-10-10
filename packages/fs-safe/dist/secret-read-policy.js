import { normalizeMaxBytes } from "./byte-budget.js";
import { resolveHomeRelativePath } from "./home-dir.js";
import fs, {} from "node:fs";
import { assertNoUnsafeDeviceReadPath } from "./device-path.js";
import { FsSafeError } from "./errors.js";
import { inspectFileIdentitySync } from "./strict-file-identity.js";
import { assertNoWindowsPathAlias } from "./windows-path-alias.js";
export const DEFAULT_SECRET_FILE_MAX_BYTES = 16 * 1024;
export function secretPathErrorCode(error) {
    const code = error?.code;
    return code === "ENOENT" || code === "ENOTDIR" ? "not-found" : "invalid-path";
}
export function secretReadError(code, action, label, resolvedPath, error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    return new FsSafeError(code, `Failed to ${action} ${label} file at ${resolvedPath}: ${String(cause)}`, { cause });
}
export function assertSecretFilePreview(stat, label, resolvedPath, maxBytes, rejectHardlinks) {
    if (!stat.isFile()) {
        throw new FsSafeError("not-file", `${label} file at ${resolvedPath} must be a regular file.`, { cause: undefined });
    }
    if (rejectHardlinks && stat.nlink > 1n) {
        throw new FsSafeError("hardlink", `${label} file at ${resolvedPath} must not be hardlinked.`, { cause: undefined });
    }
    if (stat.size > maxBytes) {
        throw new FsSafeError("too-large", `${label} file at ${resolvedPath} exceeds ${maxBytes} bytes.`, { cause: undefined });
    }
}
export function trimSecretFileContent(raw, label, resolvedPath) {
    const secret = raw.trim();
    if (!secret) {
        throw new FsSafeError("invalid-path", `${label} file at ${resolvedPath} is empty.`, { cause: undefined });
    }
    return secret;
}
export function prepareSecretRead(filePath, label, options) {
    const trimmedPath = filePath.trim();
    assertNoWindowsPathAlias(trimmedPath, "filesystem", `${label} file path uses a Windows filesystem namespace alias`);
    const resolvedPath = resolveHomeRelativePath(trimmedPath);
    if (!resolvedPath) {
        throw new FsSafeError("invalid-path", `${label} file path is empty.`, { cause: undefined });
    }
    assertNoWindowsPathAlias(resolvedPath, "filesystem", `${label} file path uses a Windows filesystem namespace alias`);
    const maxBytes = normalizeMaxBytes(options.maxBytes, {
        defaultValue: DEFAULT_SECRET_FILE_MAX_BYTES,
    });
    let rejectSymlink;
    let previewStat;
    try {
        assertNoUnsafeDeviceReadPath(resolvedPath);
        rejectSymlink = Boolean(options.rejectSymlink);
        previewStat = inspectFileIdentitySync(() => inspectInput(`${label} file at ${resolvedPath} must not be a symlink.`));
    }
    catch (error) {
        throw secretReadError(error instanceof FsSafeError ? error.code : secretPathErrorCode(error), "inspect", label, resolvedPath, error);
    }
    function inspectInput(symlinkMessage) {
        const stat = rejectSymlink
            ? fs.lstatSync(resolvedPath, { bigint: true })
            : fs.statSync(resolvedPath, { bigint: true });
        if (rejectSymlink && stat.isSymbolicLink()) {
            throw new FsSafeError("symlink", symlinkMessage);
        }
        return stat;
    }
    const rejectHardlinks = options.rejectHardlinks !== false;
    assertSecretFilePreview(previewStat, label, resolvedPath, maxBytes, rejectHardlinks);
    return { resolvedPath, maxBytes, rejectSymlink, rejectHardlinks, previewStat, inspectInput };
}
