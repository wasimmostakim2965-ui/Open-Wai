import fs from "node:fs";
import { type PinnedOpenSyncFinalAdmission } from "./pinned-open.js";
export type RootFileAdmissionFs = Pick<typeof fs, "lstatSync" | "realpathSync">;
type ExactIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export type CanonicalRootObservation = {
    ok: true;
    path: string;
    identity: ExactIdentity;
} | {
    ok: false;
    error: unknown;
};
export declare function observeCanonicalRoot(ioFs: RootFileAdmissionFs, rootPath: string): CanonicalRootObservation;
export declare function createRootFileFinalAdmission(ioFs: RootFileAdmissionFs, root: Extract<CanonicalRootObservation, {
    ok: true;
}>, boundaryLabel: string, rejectHardlinks?: boolean): PinnedOpenSyncFinalAdmission;
export {};
