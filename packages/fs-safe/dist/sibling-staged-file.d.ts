export declare function resolveCallbackTempPath(workspaceDir: string, component: string): string;
export declare function writeCallbackSibling<T>(params: {
    tempDir: string;
    tempName: string;
    write: (tempPath: string) => Promise<T>;
    producerIsolation?: "private-directory";
    resolveFinalPath: (result: T) => string;
    mode?: number;
    /** Preserve the caller's historical best-effort mode behavior. */
    ignoreModeError?: boolean;
    maxBytes?: number;
    syncTempFile: boolean;
    syncParentDir: boolean;
}): Promise<{
    filePath: string;
    result: T;
}>;
