export type WindowsAclRunner = (command: string, args: string[], options: {
    env: NodeJS.ProcessEnv;
    killSignal: NodeJS.Signals;
    timeout: number;
    windowsHide: boolean;
}) => Promise<string>;
export declare function resolveWindowsPowerShellPath(systemRoot: string | null | undefined): string;
export declare function createOwnerOnlyWindowsFile(filePath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<FileIdentity>;
export declare function applyOwnerOnlyWindowsDirectoryAcl(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function createOwnerOnlyWindowsDirectoryAncestry(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<string | undefined>;
export declare function verifyOwnerOnlyWindowsDirectoryAcl(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function verifyOwnerOnlyWindowsFileAcl(filePath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function verifySafeWindowsDirectoryEntryParent(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function verifySafeWindowsDirectoryMutationBoundary(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
type FileIdentity = {
    device: bigint;
    inode: bigint;
};
export type SecuredPrivateDirectory = {
    assertIdentityAt(directoryPath?: string): Promise<void>;
    directoryPath: string;
};
export declare function captureDirectoryIdentity(directoryPath: string): Promise<SecuredPrivateDirectory>;
export declare function syncParentDirectory(filePath: string, platform?: NodeJS.Platform): Promise<void>;
export declare function removeSecuredPrivateDirectory(secured: SecuredPrivateDirectory, currentPath?: string, quarantineBaseName?: string, options?: {
    beforeRecursiveRemove?: (quarantinePath: string) => Promise<void>;
    beforeRename?: (currentPath: string) => Promise<void>;
    claimRuntime?: PrivateMutationClaimRuntime;
    createWindowsFile?: (filePath: string) => Promise<FileIdentity>;
    platform?: NodeJS.Platform;
    removeDirectory?: (quarantinePath: string) => Promise<void>;
    syncParent?: (filePath: string, platform?: NodeJS.Platform) => Promise<void>;
}): Promise<void>;
export declare function securePrivateDirectory(directoryPath: string, options?: {
    createWindowsDirectories?: (directoryPath: string) => Promise<string | undefined>;
    currentUserId?: number;
    markMutationRoot?: boolean;
    platform?: NodeJS.Platform;
    secureWindowsDirectory?: (directoryPath: string) => Promise<void>;
    syncDirectory?: () => Promise<void>;
    syncParent?: (filePath: string, platform?: NodeJS.Platform) => Promise<void>;
}): Promise<SecuredPrivateDirectory>;
type PrivateMutationClaimWaitOptions = {
    now?: () => number;
    retryDelayMs?: number;
    signal?: AbortSignal;
    sleep?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
    timeoutMs?: number;
};
export type PrivateMutationClaimRuntime = {
    getProcessIdentity(pid: number): string | null;
    isProcessAlive(pid: number): boolean;
    ownerId: string;
    pid: number;
    processIdentity?: string;
    processStartedAtMs: number;
};
export declare function publishPrivateFileAtomically(filePath: string, contents: string, options?: {
    afterRename?: (filePath: string) => Promise<void>;
    beforeCommitRename?: (temporaryPath: string) => Promise<void>;
    beforeRename?: (temporaryPath: string) => Promise<void>;
    claimRuntime?: PrivateMutationClaimRuntime;
    claimWait?: PrivateMutationClaimWaitOptions;
    createWindowsFile?: (temporaryPath: string) => Promise<FileIdentity>;
    createWindowsDirectories?: (directoryPath: string) => Promise<string | undefined>;
    platform?: NodeJS.Platform;
    removeTemporaryFile?: (temporaryPath: string) => Promise<void>;
    secureWindowsFile?: (temporaryPath: string) => Promise<void>;
    syncParent?: (filePath: string, platform?: NodeJS.Platform) => Promise<void>;
}): Promise<void>;
export {};
