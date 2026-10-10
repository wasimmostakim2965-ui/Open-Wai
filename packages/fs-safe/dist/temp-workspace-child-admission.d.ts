import { type BigIntStats, type Stats } from "node:fs";
import type { TempWorkspaceRootAdmission } from "./temp-workspace-admission.js";
export type TempWorkspaceIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export type TempWorkspaceNumericIdentity = Readonly<{
    dev: number;
    ino: number;
}>;
export type TempWorkspaceIdentityStat = BigIntStats | Stats;
export declare const TEMP_WORKSPACE_NUMERIC_IDENTITY_REPLAY: boolean;
export declare function projectTempWorkspaceNumericIdentity(identity: TempWorkspaceIdentity): TempWorkspaceNumericIdentity | undefined;
export declare function inspectTempWorkspaceDescriptorIdentitySync(fd: number, expected: TempWorkspaceIdentity, numeric: TempWorkspaceNumericIdentity | undefined): TempWorkspaceIdentityStat;
export declare function inspectTempWorkspaceDirectoryIdentitySync(dir: string, expected: TempWorkspaceIdentity, numeric: TempWorkspaceNumericIdentity | undefined): TempWorkspaceIdentityStat;
export declare function validateTempWorkspaceDirMode(mode: number): void;
export declare function assertTrustedTempWorkspaceDirectory(stat: Pick<BigIntStats, "uid" | "gid" | "mode"> | Pick<Stats, "uid" | "gid" | "mode">, uid: number | undefined, privateDirectory?: boolean): void;
export declare function assertTempWorkspaceChildState(stat: BigIntStats | Stats, ownerUid: number | undefined): void;
export declare function validateInitialTempWorkspaceChild(stat: BigIntStats, ownerUid: number | undefined, mode: number): boolean;
export declare function childHasRequestedMode(stat: BigIntStats | Stats, mode: number): boolean;
export declare function admitTempWorkspaceChild(dir: string, expected: BigIntStats, parent: TempWorkspaceRootAdmission, mode: number): Promise<void> | undefined;
export declare function admitTempWorkspaceChildSync(dir: string, expected: BigIntStats, parent: TempWorkspaceRootAdmission, mode: number): void;
export declare function validateAdmittedTempWorkspaceChild(current: TempWorkspaceIdentityStat, ownerUid: number | undefined, mode: number): void;
