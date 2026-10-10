import type { Root } from "./root-impl.js";
export declare function isCwdIndependentAbsolutePath(filePath: string): boolean;
export declare function resolveSidecarTargetPath(resolved: string, lockRoot?: Root): Promise<string>;
export declare function resolveSidecarLockPaths(targetPath: string, explicitLockPath: string | undefined, lockRoot: Root | undefined): Promise<{
    lockPath: string;
    normalizedTargetPath: string;
}>;
