import { type ReadResult, type RootReadOptions } from "./root.js";
export type LocalRootsPathResult = {
    path: string;
    root: string;
};
export type LocalRootsReadResult = ReadResult & {
    root: string;
};
export type LocalRootsInputOptions = {
    filePath: string;
    roots: readonly string[];
    label?: string;
};
export type ResolveLocalPathFromRootsSyncOptions = LocalRootsInputOptions & {
    allowMissing?: boolean;
    requireFile?: boolean;
};
export type ReadLocalFileFromRootsOptions = LocalRootsInputOptions & RootReadOptions;
export declare function resolveLocalPathFromRootsSync(options: ResolveLocalPathFromRootsSyncOptions): LocalRootsPathResult | null;
export declare function readLocalFileFromRoots(options: ReadLocalFileFromRootsOptions): Promise<LocalRootsReadResult | null>;
