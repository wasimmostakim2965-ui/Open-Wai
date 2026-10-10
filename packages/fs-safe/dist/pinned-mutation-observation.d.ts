import { type BigIntStats } from "node:fs";
export type MutationIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
    mode: bigint;
    nlink: bigint;
}>;
declare const checkedDirectoryObservation: unique symbol;
export type MutationDirectoryCurrent = Readonly<{
    canonicalPath: string;
    identity: MutationIdentity;
}>;
export type MutationDirectoryObserver = () => MutationDirectoryCurrent | undefined;
export type MutationDirectoryObservation = Readonly<{
    path: string;
    canonicalPath: string;
    identity: MutationIdentity;
    [checkedDirectoryObservation]: true;
}>;
export type MutationPathObservation = Readonly<{
    path: string;
    ancestor: string;
    canonicalAncestor: string;
    canonicalPath: string;
    entry: MutationIdentity;
    identity: MutationIdentity;
    missingSegments: readonly string[];
    missingOffset: number;
}>;
export declare function missingMutationSegments(observation: MutationPathObservation): number;
export declare function nextMissingMutationPath(observation: MutationPathObservation): string | undefined;
export declare function checkedMutationDirectory(pathname: string, canonicalPath: string, stat: Pick<BigIntStats, "dev" | "ino" | "mode" | "nlink">, observeCurrent?: MutationDirectoryObserver): MutationDirectoryObservation;
export declare function mutationObservationUsesDirectory(observation: MutationPathObservation, directory: MutationDirectoryObservation): boolean;
export declare function observeMutationPath(pathname: string): MutationPathObservation | undefined;
export declare function mutationObservationCurrent(observation: MutationPathObservation): boolean;
export declare function mutationObservationsCurrent(observations: readonly MutationPathObservation[], directories: readonly MutationDirectoryObservation[]): boolean;
export declare function advanceMutationObservation(observation: MutationPathObservation, parent: MutationDirectoryObservation, child: MutationDirectoryObservation): MutationPathObservation | undefined;
export {};
