import { type NativeBinding } from "./native.js";
import type { TempWorkspaceRootAdmission } from "./temp-workspace-admission.js";
import { TempWorkspaceRetainedChild, type RetainedDirectory } from "./temp-workspace-descriptor.js";
export type TempWorkspaceCleanupResult = "removed" | "missing" | "identity-mismatch" | "indeterminate";
export type TempWorkspaceCleanupSafety = "compatible" | "require-bounded";
export declare class TempWorkspaceCleanupCapability {
    #private;
    readonly binding: NativeBinding | undefined;
    readonly parent: RetainedDirectory | undefined;
    constructor(root: string, safety: TempWorkspaceCleanupSafety, admission: TempWorkspaceRootAdmission, dirMode: number);
    get canRemoveOwnedTree(): boolean;
    prepareChildCreation(): void;
    admitChildDescriptor(canEnumerate: boolean): boolean;
    assertCurrent(): void;
    assertAncestryCurrent(): void;
    close(): void;
}
export declare function throwTempWorkspaceCreationFailure(error: unknown, retainedChild: TempWorkspaceRetainedChild | undefined, capability: TempWorkspaceCleanupCapability, owner?: TempWorkspaceCleanupOwner, label?: string): never;
export declare class TempWorkspaceCleanupOwner {
    #private;
    constructor(retained: TempWorkspaceRetainedChild, capability: TempWorkspaceCleanupCapability, retainDescriptor: boolean);
    cleanup(): Promise<TempWorkspaceCleanupResult>;
    cleanupSync(): TempWorkspaceCleanupResult;
}
