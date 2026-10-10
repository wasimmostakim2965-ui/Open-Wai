import { type FileHandle } from "node:fs/promises";
import { type OwnedFileDescriptorSync } from "./create-owned-file.js";
import { type CreationPermissions, type CreationParentIdentity } from "./creation-boundary.js";
export type { OwnedFileDescriptorSync } from "./create-owned-file.js";
export type CreateFileOptions = CreateDirectoryOptions;
export declare function createFileSync(targetPath: string, options?: CreateFileOptions): OwnedFileDescriptorSync;
/** Internal async writer; Windows preparation uses the nonblocking stage owner. */
export declare function createFileHandle(targetPath: string, options?: CreateFileOptions, admission?: CreationAdmission): Promise<FileHandle>;
export type CreateDirectoryOptions = CreationPermissions & {
    assertBeforeMutation?: () => void;
};
export type CreationAdmission = {
    expectedParentIdentity?: CreationParentIdentity;
};
export declare function createDirectory(targetPath: string, options?: CreateDirectoryOptions): Promise<void>;
export declare function createDirectoryWithAdmission(targetPath: string, options?: CreateDirectoryOptions, admission?: CreationAdmission): Promise<void>;
export declare function createDirectorySync(targetPath: string, options?: CreateDirectoryOptions): void;
