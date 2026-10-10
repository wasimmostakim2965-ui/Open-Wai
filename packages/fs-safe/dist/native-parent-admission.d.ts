import { type BigIntStats, type Stats } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import type { FileIdentityStat } from "./file-identity.js";
import type { NativeBinding } from "./native.js";
import { describeStagedDirectory } from "./staged-directory.js";
type RootIdentity = Pick<FileIdentityStat, "dev" | "ino">;
export type NativeRootAdmission = {
    directoryFlags?: number;
    exactRoot: boolean;
    reportCloseErrors?: boolean;
    operation: string;
    root: FileHandle;
    rootPath: string;
};
export type NativeParentAdmission = {
    fd: number;
    close(): void;
    guard: {
        dir: string;
        realPath: string;
        stat: Stats | BigIntStats;
    };
    stagedDirectory?: ReturnType<typeof describeStagedDirectory>;
};
export declare function sameNativeIdentity(left: RootIdentity, right: RootIdentity): boolean;
export declare function openNativeRootAdmission(binding: NativeBinding, params: {
    rootPath: string;
    rootIdentity?: RootIdentity;
    operation?: string;
    reportCloseErrors?: boolean;
    searchOnly?: boolean;
}): Promise<NativeRootAdmission>;
export declare function openNativeParentAdmission(binding: NativeBinding, rootAdmission: Omit<NativeRootAdmission, "root"> & {
    root: Pick<FileHandle, "fd">;
}, relativeParentPath: string, observation?: "native-directory"): Promise<NativeParentAdmission>;
export {};
