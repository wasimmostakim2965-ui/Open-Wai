import syncFs from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { createByteLimitTransform } from "./bounded-read-stream.js";
import { pipeline } from "node:stream/promises";
import { FsSafeError } from "./errors.js";
import { assertSyncStoreDirectoryReceipt, ensureSyncStoreDirectory, } from "./file-store-sync-directory.js";
import { isPathInside, splitSafeRelativePath } from "./path.js";
import { resolveOpenedFileRealPathForHandle, root } from "./root.js";
import { rootFromDirectoryGuard } from "./root-impl.js";
import { prepareSecretFileWrite } from "./secret-file.js";
import { resolveSecureTempRoot } from "./secure-temp-dir.js";
import { recursiveMkdirPath } from "./recursive-mkdir-path.js";
import { readRegularFile } from "./regular-file.js";
import { assertExclusiveCreateLeaf } from "./exclusive-create.js";
import { errorCauseOptions } from "./root-errors.js";
import { assertNoWindowsPathAlias } from "./windows-path-alias.js";
export async function ensureParentInRoot(scopedRoot, relativePath, mode) {
    const parent = literalStoreRootPath(path.posix.dirname(relativePath));
    if (parent === ".") {
        return;
    }
    await scopedRoot.mkdir(parent);
    await chmodDirectoryInRootBestEffort(scopedRoot, parent, mode).catch(() => undefined);
}
export async function openWritableStoreRoot(params) {
    assertNoWindowsPathAlias(params.rootDir, "filesystem", "store root uses a Windows filesystem namespace alias");
    await fs.mkdir(recursiveMkdirPath(params.rootDir), { recursive: true, mode: params.dirMode });
    await fs.chmod(params.rootDir, params.dirMode).catch(() => undefined);
    return await root(params.rootDir, { hardlinks: "reject", maxBytes: params.maxBytes });
}
export async function openPrivateStoreLockRoot(params) {
    const { parentGuard } = await prepareSecretFileWrite(params);
    // Bind to the admitted parent, never resolve a replacement into a fresh capability.
    return rootFromDirectoryGuard(parentGuard, { hardlinks: "reject" });
}
async function chmodDirectoryInRootBestEffort(scopedRoot, relativePath, mode) {
    const dirPath = await scopedRoot.resolve(relativePath);
    const directoryFlag = "O_DIRECTORY" in syncFs.constants ? syncFs.constants.O_DIRECTORY : 0;
    const noFollowFlag = process.platform !== "win32" && "O_NOFOLLOW" in syncFs.constants
        ? syncFs.constants.O_NOFOLLOW
        : 0;
    const handle = await fs.open(dirPath, syncFs.constants.O_RDONLY | directoryFlag | noFollowFlag);
    try {
        const stat = syncFs.fstatSync(handle.fd);
        if (!stat.isDirectory()) {
            return;
        }
        const realPath = await resolveOpenedFileRealPathForHandle(handle, dirPath);
        if (!isPathInside(scopedRoot.rootWithSep, realPath)) {
            throw new FsSafeError("outside-workspace", "directory is outside store root");
        }
        await handle.chmod(mode).catch(() => undefined);
    }
    finally {
        await handle.close().catch(() => undefined);
    }
}
export async function writeStreamToTempSource(params) {
    const maxBytes = params.maxBytes;
    const tempRoot = resolveSecureTempRoot({
        fallbackPrefix: "fs-safe-file-store",
        unsafeFallbackLabel: "file store temp dir",
        warn: () => undefined,
    });
    const dir = await fs.mkdtemp(path.join(tempRoot, "fs-safe-file-store-"));
    const filePath = path.join(dir, "payload");
    let handle = null;
    let handleClosedByStream = false;
    try {
        assertExclusiveCreateLeaf(filePath);
        handle = await fs.open(filePath, "wx", params.mode);
        const writable = handle.createWriteStream();
        writable.once("close", () => {
            handleClosedByStream = true;
        });
        const limiter = maxBytes === undefined ? undefined : createByteLimitTransform(maxBytes, () => new FsSafeError("too-large", `file exceeds maximum size of ${maxBytes} bytes`));
        if (limiter) {
            await pipeline(params.stream, limiter, writable);
        }
        else {
            await pipeline(params.stream, writable);
        }
        if (!handleClosedByStream) {
            await handle.close().catch(() => undefined);
        }
        await fs.chmod(filePath, params.mode).catch(() => undefined);
        return {
            path: filePath,
            cleanup: async () => {
                await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
            },
        };
    }
    catch (err) {
        if (handle && !handleClosedByStream) {
            await handle.close().catch(() => undefined);
        }
        await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
        throw err;
    }
}
export function ensureParentSync(params) {
    assertNoWindowsPathAlias(params.rootDir, "filesystem", "store root uses a Windows filesystem namespace alias");
    assertNoWindowsPathAlias(params.filePath, "filesystem", "store path uses a Windows filesystem namespace alias");
    return ensureStoreDirectorySync({
        rootDir: params.rootDir,
        targetDir: path.dirname(path.resolve(params.filePath)),
        mode: params.mode,
        messagePrefix: "store",
    });
}
export function ensureStoreDirectorySync(params) {
    const guard = ensureSyncStoreDirectory(params);
    assertSyncStoreDirectoryReceipt(guard);
    return guard;
}
// Store keys and directory-entry names are literal, unlike Root's home syntax.
export function literalStoreRootPath(relativePath) {
    return relativePath === "~" || relativePath.startsWith("~/") ? `./${relativePath}` : relativePath;
}
export function assertRelativePath(relativePath) {
    const raw = relativePath.trim();
    if (!raw || raw !== relativePath) {
        throw new FsSafeError("invalid-path", "store key must be non-empty and unpadded");
    }
    const segments = splitSafeRelativePath(raw);
    if (segments.length === 0 ||
        segments.join("/") !== raw ||
        raw.normalize("NFC") !== raw ||
        segments.some((segment) => /[ .]$/u.test(segment))) {
        throw new FsSafeError("invalid-path", "store key must use one canonical relative spelling");
    }
    return raw;
}
export function resolveStorePath(rootDir, relativePath) {
    const key = assertRelativePath(relativePath);
    // FileStore constructors snapshot an absolute root before this helper runs.
    // Do not re-resolve it: Node drops the trailing separator from an exact
    // Windows namespace drive root such as `\\?\C:\`.
    const root = path.isAbsolute(rootDir) ? rootDir : path.resolve(rootDir);
    // The immutable key already passed segment validation; keep the containment check.
    const target = path.resolve(root, key);
    if (!isPathInside(root, target)) {
        throw new FsSafeError("outside-workspace", "relative path escapes root");
    }
    return target;
}
// Store operation boundaries admit the primitive limit before reaching this helper.
export function assertFileStoreMaxBytes(size, limit) {
    if (limit !== undefined && size > limit) {
        throw new FsSafeError("too-large", `file exceeds maximum size of ${limit} bytes`);
    }
}
export async function readFileStoreCopySource(params) {
    assertNoWindowsPathAlias(params.sourcePath, "filesystem", "source path uses a Windows filesystem namespace alias");
    const sourceStat = syncFs.lstatSync(params.sourcePath);
    if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
        throw new FsSafeError("not-file", "source path is not a file");
    }
    assertFileStoreMaxBytes(sourceStat.size, params.maxBytes);
    try {
        return (await readRegularFile({ filePath: params.sourcePath, maxBytes: params.maxBytes }))
            .buffer;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("regular file") || message.includes("not a regular file")) {
            throw new FsSafeError("not-file", "source path is not a file", errorCauseOptions(error));
        }
        if (message.includes(`exceeds ${params.maxBytes} bytes`)) {
            throw new FsSafeError("too-large", `file exceeds maximum size of ${params.maxBytes} bytes`, errorCauseOptions(error));
        }
        throw error;
    }
}
