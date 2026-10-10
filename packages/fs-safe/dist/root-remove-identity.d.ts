import type { BigIntStats } from "node:fs";
type ExactDirectoryIdentity = Readonly<Pick<BigIntStats, "dev" | "ino">>;
export type RemovalDirectoryAssertion = ExactDirectoryIdentity & Readonly<{
    path: string;
    numericDev?: number;
    numericIno?: number;
    platform: NodeJS.Platform;
    realPath?: string;
}>;
export declare function createRemovalDirectoryAssertion(path: string, identity: ExactDirectoryIdentity, realPath?: string, platform?: NodeJS.Platform): RemovalDirectoryAssertion;
export declare function assertRemovalDirectoryCurrent(assertion: RemovalDirectoryAssertion): void;
export {};
