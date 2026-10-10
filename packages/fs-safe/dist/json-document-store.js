import { AsyncLocalStorage } from "node:async_hooks";
import { canonicalPathFromExistingAncestor } from "./absolute-path.js";
import { FsSafeError } from "./errors.js";
import { getFsSafeLockConfig } from "./lock-config.js";
import { createSidecarLockManager } from "./sidecar-lock.js";
import { serializePathWrite } from "./write-queue.js";
const activeStoreMutations = new AsyncLocalStorage();
function cloneFallback(value) {
    if (value && typeof value === "object") {
        return structuredClone(value);
    }
    return value;
}
function resolveLockOptions(filePath, options) {
    if (!options.lock) {
        return null;
    }
    const lockOptions = options.lock === true ? {} : options.lock;
    const defaults = getFsSafeLockConfig();
    return {
        managerKey: lockOptions.managerKey ?? `fs-safe.json-store:${filePath}`,
        retry: lockOptions.retry ?? defaults.retry ?? {},
        staleMs: lockOptions.staleMs ?? defaults.staleMs ?? 30_000,
        staleRecovery: lockOptions.staleRecovery ?? defaults.staleRecovery,
        timeoutMs: lockOptions.timeoutMs ?? defaults.timeoutMs ?? 30_000,
    };
}
export function createJsonStore(adapter, options = {}) {
    const lockOptions = resolveLockOptions(adapter.filePath, options);
    const locks = lockOptions ? createSidecarLockManager(lockOptions.managerKey) : null;
    async function read() {
        return await adapter.readIfExists();
    }
    async function readOr(fallback) {
        const current = await read();
        return current === undefined ? cloneFallback(fallback) : current;
    }
    function snapshotWriteOptions() {
        return {
            trailingNewline: options.trailingNewline ?? true,
            durable: options.durable,
        };
    }
    async function withSerializedMutation(run) {
        const canonicalPath = await canonicalPathFromExistingAncestor(adapter.filePath);
        const activePaths = activeStoreMutations.getStore();
        if (activePaths?.get(canonicalPath)?.active) {
            throw new FsSafeError("store-reentrant-update", `jsonStore cannot write or update ${canonicalPath} from inside its active update callback; return the complete next value from the outer update instead`);
        }
        return await serializePathWrite(`json-store:${canonicalPath}`, async () => {
            const mutationPaths = new Map([...(activePaths ?? [])].filter(([, token]) => token.active));
            const token = { active: true };
            mutationPaths.set(canonicalPath, token);
            return await activeStoreMutations.run(mutationPaths, async () => {
                try {
                    if (!locks || !lockOptions) {
                        return await run();
                    }
                    const lockRoot = adapter.prepareLock ? await adapter.prepareLock() : undefined;
                    return await locks.withLock({
                        ...(lockRoot ? { lockRoot } : {}),
                        targetPath: adapter.filePath,
                        staleMs: lockOptions.staleMs,
                        timeoutMs: lockOptions.timeoutMs,
                        retry: lockOptions.retry,
                        staleRecovery: lockOptions.staleRecovery,
                        payload: () => ({ pid: process.pid, createdAt: new Date().toISOString() }),
                    }, run);
                }
                finally {
                    token.active = false;
                }
            });
        });
    }
    return {
        filePath: adapter.filePath,
        read,
        readOr,
        readRequired: adapter.readRequired,
        write: async (value) => {
            const writeOptions = snapshotWriteOptions();
            await withSerializedMutation(async () => {
                await adapter.write(value, writeOptions);
            });
        },
        update: async (run) => {
            const writeOptions = snapshotWriteOptions();
            return await withSerializedMutation(async () => {
                const next = await run(await read());
                await adapter.write(next, writeOptions);
                return next;
            });
        },
        updateOr: async (fallback, run) => {
            const writeOptions = snapshotWriteOptions();
            return await withSerializedMutation(async () => {
                const current = await read();
                const next = await run(current === undefined ? cloneFallback(fallback) : current);
                await adapter.write(next, writeOptions);
                return next;
            });
        },
    };
}
