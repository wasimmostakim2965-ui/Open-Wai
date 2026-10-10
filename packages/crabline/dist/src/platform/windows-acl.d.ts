export type WindowsAclRunner = (command: string, args: string[], options: {
    env: NodeJS.ProcessEnv;
    killSignal: NodeJS.Signals;
    timeout: number;
    windowsHide: boolean;
}) => Promise<string>;
export type WindowsDirectorySecuritySnapshot = {
    identity: string;
    pathIdentity: string;
    securityDescriptor: string;
};
export declare function resolveWindowsPowerShellPath(systemRoot: string | null | undefined): string;
export declare function applyOwnerOnlyWindowsDirectoryAcl(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function createOwnerOnlyWindowsDirectoryAncestry(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<string | undefined>;
export declare function createOwnerOnlyWindowsDirectory(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<void>;
export declare function readWindowsDirectorySecuritySnapshot(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<WindowsDirectorySecuritySnapshot>;
export declare function readWindowsDirectoryNamespaceSecuritySnapshot(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<WindowsDirectorySecuritySnapshot>;
export declare function readWindowsDirectorySecurityDescriptor(directoryPath: string, run?: WindowsAclRunner, systemRoot?: string | null | undefined): Promise<string>;
