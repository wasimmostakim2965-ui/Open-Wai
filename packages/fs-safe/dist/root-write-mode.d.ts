import { type RootBoundaryIdentity } from "./root-boundary.js";
export declare function inheritWriteTargetMode(params: {
    targetPath: string;
    rootWithSep: string;
    rootIdentity?: RootBoundaryIdentity;
    requestedMode?: number;
}): Promise<number>;
