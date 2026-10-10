import { type PermissionFailureFields } from "./permission-exec.js";
export type WindowsOwnerExec = (command: string, args: string[]) => Promise<{
    stdout: string;
    stderr: string;
}>;
export type WindowsOwnerSummary = Omit<PermissionFailureFields & {
    sid?: string;
    currentUserSid?: string;
    daclPresent?: boolean;
    aces?: WindowsOwnerAce[];
    aclError?: string;
    trusted?: boolean;
}, never>;
export type WindowsOwnerAce = {
    sid: string;
    mask: number;
    deny: boolean;
    inheritOnly: boolean;
};
export declare function inspectWindowsOwner(params: {
    targetPath: string;
    env?: NodeJS.ProcessEnv;
    exec: WindowsOwnerExec;
}): Promise<WindowsOwnerSummary>;
