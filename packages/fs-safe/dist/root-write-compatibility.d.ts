import type { RootBoundaryIdentity } from "./root-boundary.js";
export declare function withRootFallbackCompatibilityLock<T>(params: {
    rootPath: string;
    targetPath: string;
    rootIdentity?: RootBoundaryIdentity;
    assertBeforeMutation?: () => void;
}, run: (binding: {
    targetPath: string;
    relativePath: string;
    assertBeforeMutation: () => void;
}) => Promise<T>): Promise<T>;
