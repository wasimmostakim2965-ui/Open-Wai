import { type RootBoundaryIdentity } from "./root-boundary.js";
export declare function canReuseParentWithMutationAssertion(assertion: (() => void) | undefined, rootPath: string, targetPath: string): boolean;
export declare function assertRootFallbackWritePath(expected: string | undefined, actual: string): void;
export declare function createRootWriteLockBinding(params: Readonly<{
    rootPath: string;
    targetPath: string;
    rootIdentity?: RootBoundaryIdentity;
}>): Readonly<{
    targetPath: string;
    relativePath: string;
    relativeLockPath: string;
    assertCurrent: () => void;
    dispose(): void;
}>;
