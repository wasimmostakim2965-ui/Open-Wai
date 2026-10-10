export declare const DEFAULT_PERMISSION_EXEC_TIMEOUT_MS = 30000;
export type PermissionCommandFailure = {
    command: string;
    durationMs: number;
    timedOut: boolean;
    exitCode: number | null;
    signal: string | null;
    stderr: string;
};
export type PermissionFailureFields = {
    error?: string;
    errorDetail?: PermissionCommandFailure;
    /** Original inspection failure, retained separately from serializable diagnostics. */
    errorCause?: unknown;
};
export declare function formatPermissionErrorDetail(value: string): string;
/** Formats only caught permission-query failures without invoking user code. */
export declare function formatCaughtPermissionFailure(error: unknown): string;
export declare class PermissionCommandError extends Error implements PermissionCommandFailure {
    readonly command: string;
    readonly durationMs: number;
    readonly timedOut: boolean;
    readonly exitCode: number | null;
    readonly signal: string | null;
    readonly stderr: string;
    constructor(command: string, durationMs: number, cause: unknown, timeoutMs?: number);
}
export declare function getPermissionCommandFailure(error: unknown, command: string, durationMs: number): PermissionCommandFailure | undefined;
export declare function executePermissionCommand(command: string, args: string[], timeoutMs?: number): Promise<{
    stdout: string;
    stderr: string;
}>;
