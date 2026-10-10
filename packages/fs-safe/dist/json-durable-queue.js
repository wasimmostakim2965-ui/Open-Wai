import fs, {} from "node:fs";
import path from "node:path";
import { syncDirectory } from "./directory-durability.js";
import { queueDirectories } from "./json-durable-queue-directory.js";
import { getErrorCode, acknowledgeDurableQueueEntry, claimDurableQueueEntry, completeDeliveredQueueEntry, migrateDurableQueueEntry, moveDurableQueueEntryToFailed, validateDurableQueueEntryPaths, } from "./json-durable-queue-ownership.js";
import { withJsonDurableQueueEntry } from "./json-durable-queue-read.js";
import { stringifyJsonDocument } from "./json-stringify.js";
import { replaceFileAtomicWithDirectorySync } from "./replace-file.js";
import { assertSafePathSegment } from "./safe-path-segment.js";
import { admitStandalonePublicationPath, assertNoWindowsPathAlias, hasWindowsPathAlias, } from "./windows-path-alias.js";
function assertSafeQueueEntryId(id) {
    assertSafePathSegment(id, { label: "queue entry id" });
}
export async function unlinkBestEffort(filePath) {
    if (hasWindowsPathAlias(filePath, "filesystem"))
        return;
    await fs.promises.unlink(filePath).catch(() => undefined);
}
export async function jsonDurableQueueEntryExists(filePath) {
    assertNoWindowsPathAlias(filePath);
    try {
        const stat = fs.lstatSync(filePath);
        return stat.isFile();
    }
    catch (error) {
        if (getErrorCode(error) === "ENOENT") {
            return false;
        }
        throw error;
    }
}
async function unlinkStaleTmpBestEffort(filePath, now, maxAgeMs) {
    try {
        const stat = fs.statSync(filePath);
        if (stat.isFile() && now - stat.mtimeMs >= maxAgeMs) {
            await unlinkBestEffort(filePath);
        }
    }
    catch (error) {
        if (getErrorCode(error) !== "ENOENT") {
            throw error;
        }
    }
}
export function resolveJsonDurableQueueEntryPaths(queueDir, id) {
    assertSafeQueueEntryId(id);
    assertNoWindowsPathAlias(queueDir);
    return {
        jsonPath: path.join(queueDir, `${id}.json`),
        deliveredPath: path.join(queueDir, `${id}.delivered`),
        processingPath: path.join(queueDir, `${id}.processing`),
    };
}
export async function ensureJsonDurableQueueDirs(params) {
    const queueDir = params.queueDir;
    const failedDir = params.failedDir;
    assertNoWindowsPathAlias(queueDir);
    assertNoWindowsPathAlias(failedDir);
    const directories = await queueDirectories(queueDir, failedDir);
    await directories.queue.ensure();
    await directories.failed.ensure();
}
export async function writeJsonDurableQueueEntry(params) {
    await writeQueueEntry(params);
}
async function writeQueueEntry(params, beforeRename) {
    const filePath = admitStandalonePublicationPath(params.filePath);
    const entry = params.entry;
    const tempPrefix = params.tempPrefix;
    await replaceFileAtomicWithDirectorySync({
        filePath,
        content: stringifyJsonDocument(entry, null, 2),
        mode: 0o600,
        tempPrefix,
        syncTempFile: true,
        beforeRename,
    }, syncDirectory);
}
export async function readJsonDurableQueueEntry(filePath, options = {}) {
    return await withJsonDurableQueueEntry(filePath, options, async (entry) => entry);
}
async function migrateClaimedQueueEntry(params) {
    await migrateDurableQueueEntry(params.paths, params.identity, params.releaseReadPin, async (filePath, beforePublish) => {
        await writeQueueEntry({ filePath, entry: params.entry, tempPrefix: params.tempPrefix }, beforePublish);
    });
}
export async function ackJsonDurableQueueEntry(paths) {
    await acknowledgeDurableQueueEntry(paths);
}
export async function loadJsonDurableQueueEntry(params) {
    const pathsInput = params.paths;
    const paths = validateDurableQueueEntryPaths(pathsInput);
    const claimedPath = await claimDurableQueueEntry(paths);
    if (!claimedPath)
        return null;
    const readOptions = { maxBytes: params.maxBytes };
    let processingStarted = false;
    try {
        return await withJsonDurableQueueEntry(claimedPath, readOptions, async (raw, identity, releaseReadPin) => {
            processingStarted = true;
            const read = params.read;
            const result = read ? await Reflect.apply(read, params, [raw, paths.jsonPath]) : { entry: raw };
            if (result.migrated) {
                await migrateClaimedQueueEntry({
                    paths, identity, releaseReadPin, entry: result.entry, tempPrefix: params.tempPrefix,
                });
            }
            return result.entry;
        });
    }
    catch (error) {
        if (!processingStarted && getErrorCode(error) === "ENOENT") {
            return null;
        }
        throw error;
    }
}
export async function loadPendingJsonDurableQueueEntries(options) {
    const queueDir = options.queueDir;
    assertNoWindowsPathAlias(queueDir);
    let files;
    try {
        files = await fs.promises.readdir(queueDir);
    }
    catch (error) {
        if (getErrorCode(error) === "ENOENT") {
            return [];
        }
        throw error;
    }
    const now = Date.now();
    for (const file of files) {
        if (file.endsWith(".delivered")) {
            const id = file.slice(0, -".delivered".length);
            try {
                assertSafeQueueEntryId(id);
            }
            catch {
                continue;
            }
            const paths = validateDurableQueueEntryPaths(resolveJsonDurableQueueEntryPaths(queueDir, id));
            await completeDeliveredQueueEntry(paths);
        }
        else if (options.cleanupTmpMaxAgeMs !== undefined && file.endsWith(".tmp")) {
            await unlinkStaleTmpBestEffort(path.join(queueDir, file), now, options.cleanupTmpMaxAgeMs);
        }
    }
    const ids = new Set();
    for (const file of files) {
        const suffix = file.endsWith(".processing")
            ? ".processing"
            : file.endsWith(".json")
                ? ".json"
                : null;
        if (!suffix)
            continue;
        const id = file.slice(0, -suffix.length);
        try {
            assertSafeQueueEntryId(id);
        }
        catch {
            continue;
        }
        ids.add(id);
    }
    const entries = [];
    for (const id of ids) {
        const paths = validateDurableQueueEntryPaths(resolveJsonDurableQueueEntryPaths(queueDir, id));
        const claimedPath = await claimDurableQueueEntry(paths, { skipUnowned: true });
        if (!claimedPath)
            continue;
        let migrationStarted = false;
        try {
            const entry = await withJsonDurableQueueEntry(claimedPath, { maxBytes: options.maxBytes }, async (raw, identity, releaseReadPin) => {
                const read = options.read;
                const result = read ? await Reflect.apply(read, options, [raw, paths.jsonPath]) : { entry: raw };
                if (result.migrated) {
                    migrationStarted = true;
                    await migrateClaimedQueueEntry({
                        paths, identity, releaseReadPin, entry: result.entry, tempPrefix: options.tempPrefix,
                    });
                }
                return result.entry;
            });
            entries.push(entry);
        }
        catch (error) {
            if (migrationStarted)
                throw error;
            continue;
        }
    }
    return entries;
}
export async function moveJsonDurableQueueEntryToFailed(params) {
    const id = params.id;
    const queueDir = params.queueDir;
    const failedDir = params.failedDir;
    assertSafeQueueEntryId(id);
    assertNoWindowsPathAlias(queueDir);
    assertNoWindowsPathAlias(failedDir);
    const directories = await queueDirectories(queueDir, failedDir);
    await directories.queue.assert();
    await directories.failed.ensure();
    const paths = validateDurableQueueEntryPaths(resolveJsonDurableQueueEntryPaths(queueDir, id));
    await moveDurableQueueEntryToFailed({
        paths,
        failedPath: path.join(failedDir, `${id}.json`),
    });
}
