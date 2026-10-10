import type { Root } from "./root-impl.js";
import type { HeldSidecarLock } from "./sidecar-lock-admission.js";
import { readSidecarLockRawSnapshot, type SidecarLockSnapshot } from "./sidecar-lock-reclaim.js";
export type SidecarAdmissionRunner = {
    hasToken(): boolean;
    run<T>(callback: () => T): T;
};
export declare function runSidecarAdmissionBoundary<T>(admission: SidecarAdmissionRunner, assertCurrent: () => void, callback: () => T): T;
export declare function awaitSidecarAdmissionBoundary<T>(admission: SidecarAdmissionRunner, assertCurrent: () => void, callback: () => T | PromiseLike<T>): Promise<{
    readonly value: Awaited<T>;
}>;
export type SidecarLockParserState = {
    observed: boolean;
    parser?: (raw: string) => unknown;
};
export declare function observeSidecarLockParser(state: SidecarLockParserState, admission: SidecarAdmissionRunner, accessor: () => ((raw: string) => unknown) | undefined, assertCurrent: () => void): void;
export declare function scopedSidecarLockParser(state: SidecarLockParserState, admission: SidecarAdmissionRunner, assertCurrent: () => void): ((raw: string) => unknown) | undefined;
/** Cleanup may outlive its reservation; never invoke user code after authority is lost. */
export declare function conditionalSidecarLockParser(state: SidecarLockParserState, admission: SidecarAdmissionRunner, isCurrent: () => boolean): ((raw: string) => unknown) | undefined;
export declare function parseSidecarLockSnapshotUnderAdmission(raw: Awaited<ReturnType<typeof readSidecarLockRawSnapshot>>, state: SidecarLockParserState, admission: SidecarAdmissionRunner, assertCurrent: () => void): SidecarLockSnapshot | null;
export type HeldSidecarParserObservation = {
    kind: "observed";
} | {
    kind: "holder-changed";
} | {
    kind: "read-error";
    error: unknown;
    transientDenial: boolean;
};
/** Emulate the historical EEXIST read/parser boundary without opening another sidecar. */
export declare function observeHeldSidecarParser(params: {
    admission: SidecarAdmissionRunner;
    assertToken(): void;
    currentHeld(): HeldSidecarLock | undefined;
    held: HeldSidecarLock;
    lockPath: string;
    lockRoot?: Root;
    parserState: SidecarLockParserState;
    parserAccessor(): ((raw: string) => unknown) | undefined;
    isTransientDenial(error: unknown): boolean;
}): Promise<HeldSidecarParserObservation>;
