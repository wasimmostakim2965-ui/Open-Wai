import { type PermissionFailureFields } from "./permission-exec.js";
import { type PermissionCheck, type PermissionCheckOptions } from "./permissions.js";
export type PermissionExec = (command: string, args: string[]) => Promise<{
    stdout: string;
    stderr: string;
}>;
export type WindowsAclEntry = {
    principal: string;
    /** Canonical principal SID when resolved from Windows. */
    sid?: string;
    rights: string[];
    rawRights: string;
    canRead: boolean;
    canWrite: boolean;
};
export type WindowsAclSummary = Omit<PermissionFailureFields & {
    ok: boolean;
    entries: WindowsAclEntry[];
    untrustedWorld: WindowsAclEntry[];
    untrustedGroup: WindowsAclEntry[];
    trusted: WindowsAclEntry[];
}, never>;
export type WindowsUserInfoProvider = () => {
    username?: string | null;
};
export type IcaclsResetCommandOptions = {
    isDir: boolean;
    env?: NodeJS.ProcessEnv;
    userInfo?: WindowsUserInfoProvider;
};
export declare function inspectWindowsPermissions(targetPath: string, unverified: Readonly<PermissionCheck>, opts?: PermissionCheckOptions): Promise<PermissionCheck>;
export declare function resolveWindowsUserPrincipal(env?: NodeJS.ProcessEnv, userInfo?: WindowsUserInfoProvider): string | null;
export declare function parseIcaclsOutput(output: string, targetPath: string): WindowsAclEntry[];
export declare function summarizeWindowsAcl(entries: WindowsAclEntry[], env?: NodeJS.ProcessEnv): Pick<WindowsAclSummary, "trusted" | "untrustedWorld" | "untrustedGroup">;
export declare function inspectWindowsAcl(targetPath: string, opts?: {
    env?: NodeJS.ProcessEnv;
    exec?: PermissionExec;
    currentUserSid?: string;
    principalTranslationFailed?: boolean;
}): Promise<WindowsAclSummary>;
export declare function formatWindowsAclSummary(summary: WindowsAclSummary): string;
export declare function formatIcaclsResetCommand(targetPath: string, opts: IcaclsResetCommandOptions): string;
export declare function createIcaclsResetCommand(targetPath: string, opts: IcaclsResetCommandOptions): {
    command: string;
    args: string[];
    display: string;
} | null;
