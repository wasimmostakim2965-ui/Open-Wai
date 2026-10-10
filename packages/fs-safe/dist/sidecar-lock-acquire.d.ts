import type { SidecarLockAcquireOptions, SidecarLockHandle } from "./sidecar-lock-types.js";
import type { SidecarLockAcquisitionContext } from "./sidecar-lock-admission.js";
export type { HeldSidecarLock } from "./sidecar-lock-admission.js";
export declare function acquireSidecarLock<TPayload extends Record<string, unknown>>(options: SidecarLockAcquireOptions<TPayload>, context: SidecarLockAcquisitionContext): Promise<SidecarLockHandle>;
