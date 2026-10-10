import type { TempWorkspaceOptions, TempWorkspace, TempWorkspaceSync } from "./temp-workspace-types.js";
export type { TempWorkspaceCleanupResult, TempWorkspaceCleanupSafety, } from "./temp-workspace-owner.js";
export type { TempWorkspaceOptions, TempWorkspace, TempWorkspaceSync } from "./temp-workspace-types.js";
export declare function tempWorkspace(options: TempWorkspaceOptions): Promise<TempWorkspace>;
export declare function withTempWorkspace<T>(options: TempWorkspaceOptions, run: (workspace: TempWorkspace) => Promise<T>): Promise<T>;
export declare function tempWorkspaceSync(options: TempWorkspaceOptions): TempWorkspaceSync;
export declare function withTempWorkspaceSync<T>(options: TempWorkspaceOptions, run: (workspace: TempWorkspaceSync) => T): T;
