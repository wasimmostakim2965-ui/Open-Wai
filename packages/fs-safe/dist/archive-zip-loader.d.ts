import type { ZipDirectoryEntry } from "./archive-zip-directory.js";
import { type AdmittedZipEntry } from "./archive-zip-entry.js";
export type ZipArchiveWithFiles = {
    files: Record<string, unknown>;
};
export type ZipArchiveAdmission = {
    archive: ZipArchiveWithFiles;
    entries: ReadonlyMap<string, AdmittedZipEntry>;
};
export declare function assertZipEntryBinding(archive: ZipArchiveWithFiles, record: AdmittedZipEntry, path: string): void;
/** Internal: the caller has admitted these unchanged bytes and their metadata. */
export declare function loadAdmittedZipArchive(buffer: Buffer | Uint8Array, admitted: ZipDirectoryEntry[]): Promise<ZipArchiveAdmission>;
