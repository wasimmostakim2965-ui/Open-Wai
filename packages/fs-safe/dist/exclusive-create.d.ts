import fs from "node:fs";
export declare function assertExclusiveCreateStat(pathname: string, stat: Pick<fs.Stats, "isSymbolicLink">): void;
export declare function assertExclusiveCreateLeaf(pathname: string): void;
