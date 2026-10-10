import { type NativeBinding } from "./native.js";
import type { NativeDirectoryObservation } from "./native-binding.js";
import type { ExactStatIdentity } from "./stat-observation.js";
export type NativeDirectoryObservationBackend = NativeBinding & {
    observeDirectory(pathname: string): NativeDirectoryObservation;
};
export type NativeDirectoryObservationGuard = NativeDirectoryObservation & {
    dir: string;
    identity: ExactStatIdentity;
    nativeDirectoryObservation: true;
};
export declare function getNativeDirectoryObservationBackend(enabled?: boolean): NativeDirectoryObservationBackend | undefined;
/** Exact identity, type, and canonical path captured from one retained handle. */
export declare function inspectNativeDirectoryObservation(backend: NativeDirectoryObservationBackend, pathname: string, expected?: ExactStatIdentity, platform?: NodeJS.Platform): NativeDirectoryObservation;
export declare function extendNativeDirectoryObservationGuard(observation: NativeDirectoryObservation, dir: string): NativeDirectoryObservationGuard;
export declare function isNativeDirectoryObservationGuard(guard: unknown): guard is NativeDirectoryObservationGuard;
