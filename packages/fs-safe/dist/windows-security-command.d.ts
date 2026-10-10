import type { NativeWindowsDescriptorSecurityFacts, NativeWindowsSecurityFacts } from "./native-binding.js";
import type { FsSafeNativeMode } from "./native-config.js";
import { type DescriptorFacts } from "./windows-security-facts.js";
export declare const WINDOWS_SECURITY_BATCH_MAX_BYTES: number;
/** Cleanup must preserve stages still reachable by an unsettled command. */
export declare function hasUnsettledWindowsSecurityCommand(error: unknown): boolean;
export declare function readWindowsSecurityFactsBatch(paths: readonly string[], options: {
    timeoutMs: number;
    native: boolean;
    mode: FsSafeNativeMode;
}): Promise<DescriptorFacts[]>;
export declare function readWindowsSecurityFactsCommand(targetPath: string): NativeWindowsSecurityFacts;
export declare function inspectWindowsDescriptorCommand(fd: number): Promise<NativeWindowsDescriptorSecurityFacts>;
export declare function createPrivateWindowsDirectoryCommand(targetPath: string, expectedParentIdentity?: string): Promise<{
    identity: string;
}>;
export declare function createPrivateWindowsDirectoryCommandSync(targetPath: string, expectedParentIdentity?: string): {
    identity: string;
};
export declare function inspectWindowsDirectoryCommandSync(targetPath: string, requirePrivate: boolean): {
    identity: string;
};
export declare function inspectWindowsDirectoryCommand(targetPath: string, requirePrivate: boolean): Promise<{
    identity: string;
}>;
export declare function protectPrivateWindowsFileCommandSync(fd: number, targetPath: string, expectedParentIdentity: string): {
    identity: string;
};
export declare function protectPrivateWindowsFileCommand(fd: number, targetPath: string, expectedParentIdentity: string): Promise<{
    identity: string;
}>;
export declare function verifyPrivateWindowsFileCommandSync(fd: number, targetPath: string, expectedFileIdentity: string, expectedParentIdentity: string, expectedLinks?: number): void;
export declare function verifyPrivateWindowsFileCommand(fd: number, targetPath: string, expectedFileIdentity: string, expectedParentIdentity: string, expectedLinks?: number): Promise<void>;
