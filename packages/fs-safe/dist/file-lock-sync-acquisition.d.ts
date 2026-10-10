import type { FileLockSyncHandle } from "./file-lock-sync.js";
import type { SidecarLockCompromisedInfo, SidecarLockRetryOptions } from "./sidecar-lock-types.js";
/** Owns local arbitration and retry state, independently of filesystem authority. */
export declare class SyncLockAcquisition {
    #private;
    readonly lockPath: string;
    readonly normalizedTargetPath: string;
    private readonly retry;
    private readonly timeoutMs;
    constructor(lockPath: string, normalizedTargetPath: string, retry: SidecarLockRetryOptions, timeoutMs: number | undefined);
    get owns(): boolean;
    hasToken(): boolean;
    assert(): void;
    reserve(): void;
    release(): void;
    run<T>(callback: () => T): T;
    waitForRetry(): void;
    retryDenial(error: unknown): boolean;
    monitor(held: {
        timer?: NodeJS.Timeout;
    }, handle: FileLockSyncHandle, callback: ((info: SidecarLockCompromisedInfo) => void) | undefined, interval: number | undefined, receiver: object, recordTimer?: (timer: NodeJS.Timeout) => void): void;
}
