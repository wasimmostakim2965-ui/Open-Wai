import { type DenyMutationPolicy } from "./deny-mutations.js";
import { type RootContext } from "./root-context.js";
import type { Root } from "./root-impl.js";
import type { RootDefaults } from "./root-options.js";
/** @internal Registers only instances constructed by RootHandle itself. */
export declare function registerFileLockSyncRootAdapter(handle: object, context: RootContext, defaults: RootDefaults): void;
export type FileLockSyncRootAuthority = Readonly<{
    adapter: object;
    context: RootContext;
    assertBeforeMutation?: () => void;
    denyMutations?: Readonly<DenyMutationPolicy>;
    hardlinks?: RootDefaults["hardlinks"];
    mutationPolicy: RootPathResolutionPolicy;
    readPolicy: RootPathResolutionPolicy;
    policiesMatch: boolean;
}>;
export type FileLockSyncRootPath = Readonly<{
    authority: FileLockSyncRootAuthority;
    path: string;
    relativePath: string;
}>;
export declare function captureFileLockSyncRootAuthority(lockRoot: Root): FileLockSyncRootAuthority;
export declare function invokeFileLockSyncRootMutationAuthority(authority: FileLockSyncRootAuthority): boolean;
export declare function assertFileLockSyncRootMutationAllowed(pathname: string, policy: FileLockSyncRootAuthority["denyMutations"], protectAncestors?: boolean): void;
type RootPathResolutionPolicy = Readonly<{
    rejectSymlinks?: boolean;
    rejectFinalSymlink?: boolean;
    rejectUnresolvedSymlinks: true;
}>;
export declare function admitFileLockSyncRootPath(authority: FileLockSyncRootAuthority, requestedPath: string): FileLockSyncRootPath;
export declare function assertFileLockSyncRootResolvedPathCurrent(pathAuthority: FileLockSyncRootPath): void;
export declare function assertFileLockSyncRootPathsCurrent(paths: readonly FileLockSyncRootPath[]): void;
export declare function normalizeFileLockSyncTargetWithRoot(authority: FileLockSyncRootAuthority, resolvedTargetPath: string): string;
export {};
