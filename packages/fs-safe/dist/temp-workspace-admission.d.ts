export type TempWorkspaceRootAdmission = {
    dir: string;
    ownerUid: number | undefined;
    retainCleanupParent(descriptorFd: number): void;
    prepareCleanupProbe(descriptorFd: number): void;
    prepareChildCreation(descriptorFd?: number): void;
    assertCurrent(): void;
    assertAncestry(): void;
    associateCurrent(descriptorFd: number): void;
    associateAncestry(descriptorFd: number): void;
};
export declare function admitExistingTempWorkspaceRoot(rootDir: string): TempWorkspaceRootAdmission;
export declare function admitTempWorkspaceRoot(rootDir: string): Promise<TempWorkspaceRootAdmission>;
export declare function admitTempWorkspaceRootSync(rootDir: string): TempWorkspaceRootAdmission;
