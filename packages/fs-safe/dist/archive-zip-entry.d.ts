import type { ArchiveEntryKind } from "./archive-plan.js";
import type { ZipDirectoryEntry } from "./archive-zip-directory.js";
export type ZipEntry = {
    name: string;
    dir: boolean;
    unixPermissions?: number | null;
    dosPermissions?: number | null;
    _data?: {
        crc32?: number;
        uncompressedSize?: number;
    } | PromiseLike<unknown>;
    nodeStream?: () => NodeJS.ReadableStream;
    async: (type: "nodebuffer") => Promise<Buffer>;
};
export type AdmittedZipEntry = Readonly<{
    entry: ZipEntry;
    name: string;
    kind: ArchiveEntryKind;
    mode: number | undefined;
    size: number;
    crc32: number;
}>;
/** Internal: create only after the complete decoder/admission association. */
export declare function createAdmittedZipEntry(entry: ZipEntry, name: string, physical: ZipDirectoryEntry): AdmittedZipEntry;
