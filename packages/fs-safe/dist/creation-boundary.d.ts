import { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard, type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import { FsSafeError } from "./errors.js";
export type CreationPermissions = {
    private?: boolean;
    mode?: number;
};
export declare function resolveCreationPermissions(options: CreationPermissions, directory: boolean): {
    private: boolean;
    mode: number | undefined;
};
export declare function assertPrivateFileCreationAvailable(): void;
/** Full Windows identity, with security validation when requested; no repairs. */
export declare function inspectCreationDirectorySync(targetPath: string, privatePath: boolean): string;
export declare function inspectCreationDirectory(targetPath: string, privatePath: boolean): Promise<string>;
export declare function assertPrivateDirectorySync(targetPath: string): void;
export declare function assertPrivateDirectory(targetPath: string): Promise<void>;
export declare function protectCreatedFileSync(fd: number, targetPath: string, parentIdentity: string): string;
export declare function protectCreatedFile(fd: number, targetPath: string, parentIdentity: string): Promise<string>;
export declare function verifyCreatedFileSync(fd: number, targetPath: string, identity: string, parentIdentity: string, links?: number): void;
export declare function verifyCreatedFile(fd: number, targetPath: string, identity: string, parentIdentity: string, links?: number): Promise<void>;
export declare function assertDarwinPrivateCreationAvailable(): void;
export declare function assertDarwinPrivateDirectoryMode(mode: number): void;
export declare function assertDarwinCreationAcl(fd: number, inheritanceTarget?: "file" | "directory"): void;
export declare function assertDarwinCreationDirectoryAcl(pathname: string, expected: BigIntStats, inheritanceTarget?: "file" | "directory"): void;
export type CreationPublicationStatus = "not-published" | "published" | "indeterminate";
export declare function assertCreationFile(fd: number, pathname: string, expected?: BigIntStats): BigIntStats;
export declare function assertPrivateCreationFile(stat: BigIntStats, fd: number): void;
export declare function removeRecordedCreationFileSync(pathname: string, identity: BigIntStats, assertParent: () => void): void;
export declare function removeRecordedCreationFile(pathname: string, identity: BigIntStats, assertParent: () => void): Promise<void>;
export declare function creationPublicationAfterFailure(error: unknown, recorded: CreationPublicationStatus): CreationPublicationStatus;
export declare function hasPreservedCreationArtifacts(error: unknown): boolean;
export declare function rethrowPrivateStageCreationFailure(error: unknown, path: string, stageDirectory: string): never;
export declare function privateFileSettlementFailure(params: {
    primary: unknown;
    cleanup: readonly unknown[];
    publication: CreationPublicationStatus;
    path: string;
    stageDirectory: string;
    preserved?: boolean;
}): FsSafeError;
export type CreationParentIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
    realPath?: string;
}>;
export type CreationPath = {
    target: string;
    parent: AsyncDirectoryGuard<BigIntStats>;
    assertParent(): void;
};
export declare function assertBeforeCreation(selected: CreationPath, permissions: CreationPermissions, assertion: (() => void) | undefined, kind: "file" | "directory"): void;
export declare function creationAdmissionFromParent(parent: AnyAsyncDirectoryGuard): {
    expectedParentIdentity: CreationParentIdentity;
};
export declare function prepareCreationPath(input: string, expectedParent?: CreationParentIdentity): CreationPath;
export declare function creationCollision(error: unknown): unknown;
/** Remove only the recorded empty stage; never traverse a replaced directory. */
export declare function removeCreationDirectory(directory: string, identity: BigIntStats, assertParent: () => void): void;
export declare function removeCreationDirectoryAsync(directory: string, identity: BigIntStats, assertParent: () => void): Promise<void>;
