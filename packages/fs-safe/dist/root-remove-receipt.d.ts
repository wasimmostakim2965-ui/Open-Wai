import type { BigIntStats } from "node:fs";
export type CapturedRemovalDirectory = Readonly<{
    path: string;
    stat: BigIntStats;
}>;
export declare class RemovalPathReceipts {
    private rootStat;
    private directories;
    readonly observeRoot: (stat: BigIntStats) => void;
    observeDirectory(dir: string, stat: BigIntStats): void;
    complete(rootReal: string, targetPath: string): {
        rootStat: BigIntStats;
        parent: CapturedRemovalDirectory | undefined;
        directories: readonly CapturedRemovalDirectory[];
    } | undefined;
}
