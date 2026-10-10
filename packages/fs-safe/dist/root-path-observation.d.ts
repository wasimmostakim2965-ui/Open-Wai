import fs, { type BigIntStats } from "node:fs";
import { type DirectoryObservationGuard } from "./directory-guard.js";
import { type NativeDirectoryObservationBackend, type NativeDirectoryObservationGuard } from "./native-directory-observation.js";
import { type RootBoundaryIdentity } from "./root-boundary.js";
import { type StatObservationReceipt } from "./stat-observation.js";
export type RootPathObservationKind = "stat" | "directory";
export type RootPathDirectoryObservationGuard = DirectoryObservationGuard | NativeDirectoryObservationGuard;
export type RootPathTargetObservation = StatObservationReceipt | NativeDirectoryObservationGuard;
/** An exact receipt owned by one stat/list operation. Never cache it. */
export type RootPathObservationReceipt = Pick<RootPathObservationRequest & {
    directoryGuard: RootPathDirectoryObservationGuard;
    targetPath: string;
    target: RootPathTargetObservation;
}, "kind" | "rootGuard" | "directoryGuard" | "directoryObserver" | "targetPath" | "target">;
/** A failed initial target lookup must not discard its already admitted parent. */
export type RootPathParentObservationReceipt = Omit<RootPathObservationReceipt, "kind" | "target"> & {
    kind: "stat-parent";
};
export type RootPathObservationRequest = {
    kind: RootPathObservationKind;
    rootGuard: DirectoryObservationGuard;
    directoryObserver?: NativeDirectoryObservationBackend;
};
export type RootPathTraversalObservation = Omit<Partial<RootPathObservationReceipt> & {
    enabled: boolean;
    request: RootPathObservationRequest;
    targetIndex: number;
    directoryIndex: number;
}, "kind" | "rootGuard">;
export type RootPathObservedTraversalEntry = StatObservationReceipt | {
    stat: fs.Stats | BigIntStats;
    identity?: undefined;
} | NativeDirectoryObservationGuard;
export declare class RootPathObservationError extends Error {
    readonly error: unknown;
    readonly parentReceipt?: RootPathParentObservationReceipt | undefined;
    readonly traversalFailure: boolean;
    constructor(error: unknown, parentReceipt?: RootPathParentObservationReceipt | undefined, traversalFailure?: boolean);
}
export type RootPathTraversalContext = {
    observationEligible: boolean;
    rootPath: string;
    rootCanonicalPath: string;
    resolveParams: {
        rootIdentity?: RootBoundaryIdentity;
    };
    state: {
        finalComponentIndex: number;
        relativePath: string;
        segments: string[];
    };
};
export declare function createRootPathTraversalObservation(context: RootPathTraversalContext, request?: RootPathObservationRequest): RootPathTraversalObservation | undefined;
export declare function inspectRootPathTraversalEntry(pathname: string, directorySlot: boolean, observation: RootPathTraversalObservation): RootPathObservedTraversalEntry;
export declare function captureRootPathObservedDirectory(observation: RootPathTraversalObservation, observed: RootPathObservedTraversalEntry, publicPath: string, canonicalPath: string, rootCanonicalPath: string, rootIdentity?: RootBoundaryIdentity): boolean;
