import { type BigIntStats, type Stats } from "node:fs";
import type { RootMoveOptions } from "./root-options.js";
import { type RootContext } from "./root-context.js";
export declare function admitMoveSourceStat<T extends Stats | BigIntStats>(stat: T, overwrite?: boolean): T;
export declare function movePathNative(root: RootContext, params: Pick<RootMoveOptions, "assertBeforeMutation" | "denyMutations" | "mutationSymlinks">, paths: {
    sourcePath: string;
    sourceParentPath: string;
    targetPath: string;
    targetParentPath: string;
    sourceOriginalPath?: string;
    targetOriginalPath?: string;
    sourceCanonicalPath?: string;
    targetCanonicalPath?: string;
    expectedSourceIdentity?: BigIntStats;
}, overwrite?: boolean): Promise<void>;
