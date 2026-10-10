import type { HeldSidecarLock } from "./sidecar-lock-admission.js";
import type { SidecarLockHandle } from "./sidecar-lock-types.js";
export declare function stopSidecarLockMonitoring(held: {
    compromiseTimer?: NodeJS.Timeout;
}): void;
export declare function createSidecarLockHandle(params: {
    lockPath: string;
    normalizedTargetPath: string;
    verifyStillHeld: () => Promise<boolean>;
    release: (options?: {
        retry?: boolean;
    }) => Promise<unknown>;
}): SidecarLockHandle;
export declare function createHeldSidecarLockHandle(params: {
    normalizedTargetPath: string;
    held: Pick<HeldSidecarLock, "lockPath" | "snapshot" | "lockRoot" | "parsePayload">;
    release: (options?: {
        retry?: boolean;
    }) => Promise<unknown>;
}): SidecarLockHandle;
