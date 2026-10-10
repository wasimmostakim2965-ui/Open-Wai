import fsSync from "node:fs";
import type { FileIdentityStat } from "./file-identity.js";
import type { TempWorkspaceRootAdmission } from "./temp-workspace-admission.js";
import { type TempWorkspaceIdentityStat } from "./temp-workspace-child-admission.js";
type DirectoryDescriptorAccess = "read" | "search";
export type RetainedDirectory = {
    fd: number;
    access: DirectoryDescriptorAccess;
    receipt: Readonly<{
        path: string;
    }>;
};
export type RetainedChildDirectory = {
    fd: number;
};
export declare function openTempWorkspaceCleanupParent(root: string, admission: TempWorkspaceRootAdmission): RetainedDirectory;
/** Owns the child descriptor until final admission transfers it to cleanup. */
export declare class TempWorkspaceRetainedChild {
    #private;
    private constructor();
    static retain(dir: string, identity: FileIdentityStat): TempWorkspaceRetainedChild;
    static retainCreated(dir: string): {
        retained: TempWorkspaceRetainedChild;
        stat: fsSync.BigIntStats;
    };
    discardInitialReceipt(): void;
    finalizeAdmission(ownerUid: number | undefined, mode: number): TempWorkspaceIdentityStat;
    initializeMode(mode: number, ownerUid: number | undefined, assertParent: () => void): Promise<void>;
    initializeModeSync(mode: number, ownerUid: number | undefined, assertParent: () => void): void;
    get canEnumerate(): boolean;
    ensureReadable(): boolean;
    transfer(retainDescriptor: boolean): {
        dir: string;
        identity: Readonly<{
            dev: bigint;
            ino: bigint;
        }>;
        directory: RetainedChildDirectory | undefined;
    };
    close(): void;
}
export {};
