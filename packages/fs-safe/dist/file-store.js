import syncFs from "node:fs";
import { normalizeMaxBytes } from "./byte-budget.js";
import { readFileDescriptorBoundedSync } from "./bounded-read.js";
import { FsSafeError } from "./errors.js";
import { pruneExpiredStoreEntries } from "./file-store-prune.js";
import { assertFileStoreMaxBytes, assertRelativePath, ensureParentInRoot, literalStoreRootPath, openPrivateStoreLockRoot, openWritableStoreRoot, readFileStoreCopySource, resolveStorePath, writeStreamToTempSource, } from "./file-store-boundary.js";
import { writeFileSyncAtomic } from "./file-store-sync-write.js";
import { createJsonStore } from "./json-document-store.js";
import { stringifyJsonDocument } from "./json-stringify.js";
import { isNotFoundPathError } from "./path.js";
import { errorCauseOptions, throwFsSafeReadError } from "./root-errors.js";
import { root } from "./root.js";
import { DEFAULT_ROOT_MAX_BYTES } from "./root-impl.js";
import { matchRootFileOpenFailure, openRootFileSync } from "./root-file.js";
import { writeSecretFileAtomic } from "./secret-file.js";
import { assertNoWindowsPathAlias, resolvePathPreservingWindowsRoot, } from "./windows-path-alias.js";
function snapshotWriteOptions(options, durabilityFirst = true) {
    if (options == null)
        return undefined;
    return durabilityFirst ? {
        maxBytes: options.maxBytes,
        durable: options.durable,
        dirMode: options.dirMode,
        mode: options.mode,
    } : {
        maxBytes: options.maxBytes,
        dirMode: options.dirMode,
        mode: options.mode,
        durable: options.durable,
    };
}
function isNotFound(error) {
    return error instanceof FsSafeError ? error.code === "not-found" : isNotFoundPathError(error);
}
function handleSyncStoreReadOpenFailure(opened) {
    return matchRootFileOpenFailure(opened, {
        path: (failure) => {
            if (isNotFound(failure.error)) {
                return null;
            }
            throw new FsSafeError("path-mismatch", "store target changed during read", errorCauseOptions(failure.error));
        },
        validation: (failure) => {
            if (failure.error instanceof FsSafeError) {
                throw failure.error;
            }
            // Validation failures mean the path existed but violated store policy
            // (directory, hardlink, symlink race). Do not report them as missing.
            throw new FsSafeError("path-mismatch", "store target failed read validation", errorCauseOptions(failure.error));
        },
        io: (failure) => throwFsSafeReadError(failure.error, "store"),
        fallback: (failure) => {
            throw new FsSafeError("path-mismatch", "store target changed during read", errorCauseOptions(failure.error));
        },
    });
}
async function copyIntoRoot(params) {
    const relativePath = params.relativePath;
    const destination = resolveStorePath(params.rootDir, relativePath);
    assertNoWindowsPathAlias(params.sourcePath, "filesystem", "source path uses a Windows filesystem namespace alias");
    const sourceStat = syncFs.lstatSync(params.sourcePath);
    if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
        throw new FsSafeError("not-file", "source path is not a file");
    }
    assertFileStoreMaxBytes(sourceStat.size, params.maxBytes);
    const scopedRoot = await openWritableStoreRoot({
        rootDir: params.rootDir,
        dirMode: params.dirMode,
        maxBytes: params.maxBytes,
    });
    await ensureParentInRoot(scopedRoot, relativePath, params.dirMode);
    await scopedRoot.copyIn(literalStoreRootPath(relativePath), params.sourcePath, {
        durable: params.durable,
        maxBytes: params.maxBytes,
        mkdir: false,
        mode: params.mode,
    });
    return destination;
}
export function fileStore(options) {
    const rootDirInput = options.rootDir;
    assertNoWindowsPathAlias(rootDirInput, "filesystem", "store root uses a Windows filesystem namespace alias");
    const rootDir = resolvePathPreservingWindowsRoot(rootDirInput);
    assertNoWindowsPathAlias(rootDir, "filesystem", "store root uses a Windows filesystem namespace alias");
    const privateMode = options.private ?? false;
    const dirMode = options.dirMode ?? 0o700;
    const mode = options.mode ?? 0o600;
    const durable = options.durable ?? true;
    const maxBytes = normalizeMaxBytes(options.maxBytes);
    async function openRoot() {
        return await root(rootDir, { hardlinks: "reject", maxBytes });
    }
    async function write(relativePath, data, writeOptions) {
        const destination = resolveStorePath(rootDir, relativePath);
        const content = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const writeMaxBytes = normalizeMaxBytes(writeOptions?.maxBytes, { defaultValue: maxBytes });
        assertFileStoreMaxBytes(content.byteLength, writeMaxBytes);
        if (privateMode) {
            await writeSecretFileAtomic({
                rootDir,
                filePath: destination,
                content,
                durable: writeOptions?.durable ?? durable,
                dirMode: writeOptions?.dirMode ?? dirMode,
                mode: writeOptions?.mode ?? mode,
            });
            return destination;
        }
        const writeDirMode = writeOptions?.dirMode ?? dirMode;
        const writeMode = writeOptions?.mode ?? mode;
        const writeDurable = writeOptions?.durable ?? durable;
        const scopedRoot = await openWritableStoreRoot({
            rootDir,
            dirMode: writeDirMode,
            maxBytes: writeMaxBytes,
        });
        await ensureParentInRoot(scopedRoot, relativePath, writeDirMode);
        await scopedRoot.write(literalStoreRootPath(relativePath), content, {
            mkdir: false,
            mode: writeMode,
            durable: writeDurable,
        });
        return destination;
    }
    return {
        rootDir,
        path: (relativePath) => resolveStorePath(rootDir, relativePath),
        root: openRoot,
        write,
        writeStream: async (relativePath, stream, writeOptions) => {
            const destination = resolveStorePath(rootDir, relativePath);
            const configuredLimit = normalizeMaxBytes(writeOptions?.maxBytes, { defaultValue: maxBytes });
            const limit = configuredLimit ?? (privateMode ? DEFAULT_ROOT_MAX_BYTES : undefined);
            if (privateMode) {
                const writeDurable = writeOptions?.durable ?? durable;
                const writeDirMode = writeOptions?.dirMode ?? dirMode;
                const writeMode = writeOptions?.mode ?? mode;
                const chunks = [];
                let total = 0;
                for await (const chunk of stream) {
                    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk);
                    total += buffer.byteLength;
                    assertFileStoreMaxBytes(total, limit);
                    chunks.push(buffer);
                }
                await writeSecretFileAtomic({
                    rootDir,
                    filePath: destination,
                    content: Buffer.concat(chunks),
                    durable: writeDurable,
                    dirMode: writeDirMode,
                    mode: writeMode,
                });
                return destination;
            }
            const writeMode = writeOptions?.mode ?? mode;
            const writeDurable = writeOptions?.durable ?? durable;
            const writeDirMode = writeOptions?.dirMode ?? dirMode;
            const staged = await writeStreamToTempSource({
                stream,
                maxBytes: limit,
                mode: writeMode,
            });
            try {
                await copyIntoRoot({
                    rootDir,
                    relativePath,
                    sourcePath: staged.path,
                    durable: writeDurable,
                    maxBytes: limit,
                    mode: writeMode,
                    tempPrefix: writeOptions?.tempPrefix,
                    dirMode: writeDirMode,
                });
            }
            finally {
                await staged.cleanup();
            }
            return destination;
        },
        copyIn: async (relativePath, sourcePath, writeOptions) => {
            const configuredLimit = normalizeMaxBytes(writeOptions?.maxBytes, { defaultValue: maxBytes });
            if (privateMode) {
                const policy = writeOptions == null
                    ? undefined
                    : {
                        maxBytes: configuredLimit,
                        durable: writeOptions?.durable,
                        dirMode: writeOptions?.dirMode,
                        mode: writeOptions?.mode,
                    };
                const buffer = await readFileStoreCopySource({
                    sourcePath,
                    maxBytes: configuredLimit ?? DEFAULT_ROOT_MAX_BYTES,
                });
                return await write(relativePath, buffer, policy);
            }
            return await copyIntoRoot({
                rootDir,
                relativePath,
                sourcePath,
                durable: writeOptions?.durable ?? durable,
                dirMode: writeOptions?.dirMode ?? dirMode,
                maxBytes: configuredLimit,
                mode: writeOptions?.mode ?? mode,
                tempPrefix: writeOptions?.tempPrefix,
            });
        },
        open: async (relativePath, readOptions) => await (await openRoot()).open(literalStoreRootPath(assertRelativePath(relativePath)), readOptions),
        read: async (relativePath, readOptions) => await (await openRoot()).read(literalStoreRootPath(assertRelativePath(relativePath)), readOptions),
        readBytes: async (relativePath, readOptions) => await (await openRoot()).readBytes(literalStoreRootPath(assertRelativePath(relativePath)), readOptions),
        readText: async (relativePath, readOptions) => {
            const { encoding = "utf8", ...options } = readOptions ?? {};
            return (await (await openRoot()).read(literalStoreRootPath(assertRelativePath(relativePath)), options)).buffer
                .toString(encoding);
        },
        readTextIfExists: async (relativePath, readOptions) => {
            try {
                return await (await openRoot()).readText(literalStoreRootPath(assertRelativePath(relativePath)), readOptions);
            }
            catch (error) {
                if (isNotFound(error)) {
                    return null;
                }
                throwFsSafeReadError(error, "store");
            }
        },
        readJson: async (relativePath, readOptions) => {
            const { encoding = "utf8", ...options } = readOptions ?? {};
            return JSON.parse((await (await openRoot()).read(literalStoreRootPath(assertRelativePath(relativePath)), options)).buffer
                .toString(encoding));
        },
        readJsonIfExists: async (relativePath, readOptions) => {
            try {
                return await (await openRoot()).readJson(literalStoreRootPath(assertRelativePath(relativePath)), readOptions);
            }
            catch (error) {
                if (isNotFound(error)) {
                    return null;
                }
                throwFsSafeReadError(error, "store");
            }
        },
        remove: async (relativePath) => {
            await (await openRoot()).remove(literalStoreRootPath(assertRelativePath(relativePath)));
        },
        exists: async (relativePath) => await (await openRoot()).exists(literalStoreRootPath(assertRelativePath(relativePath))),
        writeText: async (relativePath, data, writeOptions) => await write(relativePath, data, writeOptions),
        writeJson: async (relativePath, data, writeOptions) => {
            const trailingNewline = writeOptions?.trailingNewline;
            const policy = snapshotWriteOptions(writeOptions, privateMode);
            const json = stringifyJsonDocument(data, null, 2);
            return await write(relativePath, trailingNewline === false ? json : `${json}\n`, policy);
        },
        json: (relativePath, jsonOptions) => {
            const filePath = resolveStorePath(rootDir, relativePath);
            return createJsonStore({
                filePath,
                ...(privateMode ? {
                    prepareLock: () => openPrivateStoreLockRoot({ rootDir, filePath, mode, dirMode }),
                } : {}),
                readIfExists: async () => {
                    try {
                        return await (await openRoot()).readJson(literalStoreRootPath(relativePath));
                    }
                    catch (error) {
                        if (isNotFound(error)) {
                            return undefined;
                        }
                        throw error;
                    }
                },
                readRequired: async () => await (await openRoot()).readJson(literalStoreRootPath(relativePath)),
                write: async (value, options) => {
                    const json = stringifyJsonDocument(value, null, 2);
                    await write(relativePath, options?.trailingNewline === false ? json : `${json}\n`, { durable: options?.durable });
                },
            }, jsonOptions);
        },
        pruneExpired: async (pruneOptions) => {
            await pruneExpiredStoreEntries({ rootDir, dirMode, options: pruneOptions });
        },
    };
}
export function fileStoreSync(options) {
    const rootDirInput = options.rootDir;
    assertNoWindowsPathAlias(rootDirInput, "filesystem", "store root uses a Windows filesystem namespace alias");
    const rootDir = resolvePathPreservingWindowsRoot(rootDirInput);
    assertNoWindowsPathAlias(rootDir, "filesystem", "store root uses a Windows filesystem namespace alias");
    const privateMode = options.private ?? false;
    const dirMode = options.dirMode ?? 0o700;
    const mode = options.mode ?? 0o600;
    const durable = options.durable ?? true;
    const maxBytes = normalizeMaxBytes(options.maxBytes);
    function write(relativePath, data, writeOptions) {
        const destination = resolveStorePath(rootDir, relativePath);
        const content = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const writeMaxBytes = normalizeMaxBytes(writeOptions?.maxBytes, { defaultValue: maxBytes });
        assertFileStoreMaxBytes(content.byteLength, writeMaxBytes);
        return writeFileSyncAtomic({
            rootDir,
            filePath: destination,
            content,
            privateMode,
            durable: writeOptions?.durable ?? durable,
            dirMode: writeOptions?.dirMode ?? dirMode,
            mode: writeOptions?.mode ?? mode,
        });
    }
    let readTextIfExists;
    return {
        rootDir,
        path: (relativePath) => resolveStorePath(rootDir, relativePath),
        readTextIfExists: readTextIfExists = (relativePath, readOptions) => {
            const limit = normalizeMaxBytes(readOptions?.maxBytes, { defaultValue: maxBytes });
            const targetPath = resolveStorePath(rootDir, relativePath);
            const opened = openRootFileSync({
                absolutePath: targetPath,
                rootPath: rootDir,
                boundaryLabel: "store root",
                rejectHardlinks: true,
            });
            if (!opened.ok) {
                return handleSyncStoreReadOpenFailure(opened);
            }
            try {
                assertFileStoreMaxBytes(opened.stat.size, limit);
                try {
                    return limit === undefined
                        ? syncFs.readFileSync(opened.fd, "utf8")
                        : readFileDescriptorBoundedSync(opened.fd, limit).toString("utf8");
                }
                catch (error) {
                    throwFsSafeReadError(error, "store");
                }
            }
            finally {
                syncFs.closeSync(opened.fd);
            }
        },
        readJsonIfExists: (relativePath, readOptions) => {
            const raw = readTextIfExists(relativePath, readOptions);
            return raw === null ? null : JSON.parse(raw);
        },
        write,
        writeText: (relativePath, data, writeOptions) => write(relativePath, data, writeOptions),
        writeJson: (relativePath, data, writeOptions) => {
            const trailingNewline = writeOptions?.trailingNewline;
            const policy = snapshotWriteOptions(writeOptions);
            const json = stringifyJsonDocument(data, null, 2);
            return write(relativePath, trailingNewline === false ? json : `${json}\n`, policy);
        },
    };
}
