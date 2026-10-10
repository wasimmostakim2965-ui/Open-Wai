import type { WindowsDirectorySecuritySnapshot } from "./windows-acl.js";
export type WindowsLockRootIdentity = {
    handleIdentity: string;
    securityDescriptor: string;
};
export declare function secureCachedWindowsLockRoot(options: {
    cache: Map<string, Promise<WindowsLockRootIdentity>>;
    cacheKey: string;
    createDirectory: () => Promise<void>;
    errorPrefix: string;
    readSecuritySnapshot: () => Promise<WindowsDirectorySecuritySnapshot>;
    root: string;
}): Promise<string>;
