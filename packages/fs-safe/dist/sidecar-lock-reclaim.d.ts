import { type BigIntStats, type Stats } from "node:fs";
import type { Root } from "./root-impl.js";
export type SidecarLockStaleSnapshot = {
    lockPath: string;
    normalizedTargetPath: string;
    raw: string;
    payload: unknown;
};
export type SidecarLockSnapshot = {
    raw?: string;
    payload: unknown;
    stat?: Stats | BigIntStats;
    ownershipToken?: string;
};
type SidecarLockRawSnapshot = Omit<SidecarLockSnapshot, "payload"> & {
    raw: string;
};
export declare function parseSidecarLockSnapshot(snapshot: SidecarLockRawSnapshot | null, parser?: (raw: string) => unknown): SidecarLockSnapshot | null;
export declare function readSidecarLockOwnershipToken(raw: string): string | undefined;
export declare function serializeSidecarLockPayload(payload: Record<string, unknown>): {
    raw: string;
    ownershipToken: string;
};
export declare function relativeSidecarLockPath(lockRoot: Root, lockPath: string): string;
export declare function parseSidecarLockPayload(raw: string, parser?: (raw: string) => unknown): unknown;
export declare function readSidecarLockRawSnapshot(lockPath: string, options?: {
    lockRoot?: Root;
    rejectNonFile?: boolean;
    allowDescriptorIdentityDrift?: boolean;
    discardObservation?: "unlinked" | "changed";
    onOpenFailure?: (error: unknown) => void;
}): Promise<SidecarLockRawSnapshot | null>;
export declare function readSidecarLockSnapshotSync(lockPath: string, parsePayload?: (raw: string) => unknown, options?: Parameters<typeof readSidecarLockRawSnapshotSync>[1]): SidecarLockSnapshot | null;
export declare function readSidecarLockRawSnapshotSync(lockPath: string, options?: {
    rejectNonFile?: boolean;
    onOpenFailure?: (error: unknown) => void;
}): SidecarLockRawSnapshot | null;
export declare function removeSidecarLockIfUnchangedSync(lockPath: string, observed: SidecarLockSnapshot, assertAuthorized?: () => void): boolean;
export declare function sidecarLockSnapshotMatches(current: SidecarLockRawSnapshot | SidecarLockSnapshot, observed: SidecarLockSnapshot): boolean;
export declare function removeSidecarLockIfUnchanged(lockPath: string, observed: SidecarLockSnapshot | null, options?: {
    lockRoot?: Root;
    parsePayload?: (raw: string) => unknown;
}): Promise<boolean>;
export declare function sidecarLockSnapshotStillPresent(lockPath: string, observed: SidecarLockSnapshot | null, options?: {
    lockRoot?: Root;
    parsePayload?: (raw: string) => unknown;
}): Promise<boolean>;
export type SidecarReclaimGuard = {
    assertHeld?(): Promise<void>;
    release(): Promise<void>;
};
export declare function sidecarReclaimGuardExists(pathname: string, lockRoot?: Root): Promise<boolean>;
export declare function tryAcquireSidecarReclaimGuard(reclaimGuards: Set<string>, pathname: string, lockRoot?: Root): Promise<SidecarReclaimGuard | undefined>;
export declare function removeStaleSidecarLockIfAllowed(params: {
    lockPath: string;
    normalizedTargetPath: string;
    snapshot: SidecarLockSnapshot;
    shouldRemoveStaleLock?: (snapshot: SidecarLockStaleSnapshot) => boolean | Promise<boolean>;
    lockRoot?: Root;
    parsePayload?: (raw: string) => unknown;
    assertAuthorized?: () => void;
    assertGuardHeld?: () => Promise<void>;
}): Promise<"removed" | "changed" | "not-approved">;
export {};
