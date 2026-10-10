type DirectoryOwner = {
    uid: number | bigint;
    gid: number | bigint;
};
export type TempWorkspaceOwnership = "user" | "root" | "unmapped" | "foreign";
export declare function classifyTempWorkspaceOwner(stat: DirectoryOwner, uid: number): TempWorkspaceOwnership;
export declare function warnUnmappedTempWorkspaceAncestor(): void;
export {};
