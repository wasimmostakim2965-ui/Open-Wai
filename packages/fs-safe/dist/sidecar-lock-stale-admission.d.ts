import { type SidecarReclaimGuard } from "./sidecar-lock-reclaim.js";
import { type SidecarLockParserState, type SidecarAdmissionRunner } from "./sidecar-lock-admission-parser.js";
import type { Root } from "./root-impl.js";
import type { SidecarLockAcquireOptions } from "./sidecar-lock-types.js";
type StaleOptions = Pick<SidecarLockAcquireOptions<Record<string, unknown>>, "shouldReclaim" | "shouldRemoveStaleLock" | "staleRecovery">;
export type SidecarLockStaleOptionsState = {
    shouldReclaimObserved?: boolean;
    shouldReclaim?: StaleOptions["shouldReclaim"];
    shouldRemoveObserved?: boolean;
    shouldRemove?: StaleOptions["shouldRemoveStaleLock"];
    staleRecoveryObserved?: boolean;
    staleRecovery?: StaleOptions["staleRecovery"];
};
/** Handle one historical EEXIST attempt while its canonical admission is held. */
export declare function handleStaleSidecarAdmission<TPayload extends Record<string, unknown>>(params: {
    admission: SidecarAdmissionRunner;
    assertToken(): void;
    currentHeld(): unknown;
    lockPath: string;
    lockRoot?: Root;
    normalizedTargetPath: string;
    options: SidecarLockAcquireOptions<TPayload>;
    parserState: SidecarLockParserState;
    reclaimGuardPath: string;
    reclaimGuards: Set<string>;
    setReclaimGuard(guard: SidecarReclaimGuard): void;
    releaseReclaimGuard(): Promise<void>;
    staleOptionsState: SidecarLockStaleOptionsState;
    staleMs: number;
    withinDenialBudget(): boolean;
    retryOrRethrowDenial(error: unknown): Promise<void>;
    waitForRetry(): Promise<void>;
}): Promise<void>;
export {};
