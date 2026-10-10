import { FsSafeError } from "./errors.js";
export type WindowsPathAliasKind = "filesystem" | "relative";
/**
 * True when a Windows path could reach a UNC share or device namespace that
 * none of the trusted boundary paths live on: its share or device differs from
 * theirs or cannot be identified from its spelling, and it is not spelled
 * exactly under one of them. Reject such input before any filesystem call:
 * even lstat on `\\host\share\x` makes Windows contact host.
 */
export declare function isForeignWindowsShareOrDevicePath(value: string, trustedPaths: readonly (string | undefined)[], platform?: NodeJS.Platform | string): boolean;
/**
 * Capture an ordinary Windows drive-relative path without normalizing its raw
 * suffix. This is only for public APIs whose existing contract accepts such
 * paths; callers must still run namespace-alias admission on the result.
 */
export declare function anchorWindowsDriveRelativePath(value: string): string;
/**
 * Resolve a path without letting Node erase the separator from an exact
 * extended-length drive root such as `\\?\C:\`. Bare `\\?\C:` input remains
 * unchanged so the surrounding alias admission rejects it.
 */
export declare function resolvePathPreservingWindowsRoot(value: string): string;
/**
 * Preserve a namespaced drive root after a caller has already resolved the
 * input. This lets admission fast paths keep exactly one live path.resolve
 * call while retaining the same root-repair behavior as the general helper.
 */
export declare function repairResolvedWindowsRoot(value: string, resolved: string): string;
/**
 * Resolve path segments against a base while preserving a namespaced drive
 * root when Node normalizes a legitimate rooted input back to that root.
 * Raw bare namespace drives stay bare so admission checks still reject them.
 */
export declare function resolvePathFromBasePreservingWindowsRoot(base: string, ...segments: string[]): string;
/**
 * Adapt an admitted namespaced drive root for Node's Windows filesystem layer.
 * Node removes the root separator from these paths during filesystem dispatch,
 * so use the equivalent ordinary drive root for the operation. This is not an
 * admission check: callers must validate attacker-controlled input first.
 */
export declare function pathForWindowsFilesystem(value: string): string;
/** Returns true when a Windows pathname can address an alternate filesystem namespace. */
export declare function hasWindowsPathAlias(value: string, kind: WindowsPathAliasKind, platform?: NodeJS.Platform | string): boolean;
export declare function assertNoWindowsPathAliasForPlatform(value: string, kind: WindowsPathAliasKind, message: string, platform: NodeJS.Platform | string | undefined): void;
export declare function assertNoWindowsPathAlias(value: string, kind?: WindowsPathAliasKind, message?: string, platform?: NodeJS.Platform | string): void;
export declare function isWindowsPathAliasError(error: unknown): error is FsSafeError;
export declare function admitStandalonePublicationPath(value: string, message?: string): string;
