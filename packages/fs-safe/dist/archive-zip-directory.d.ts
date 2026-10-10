import { type ResolvedArchiveExtractLimits } from "./archive-limits.js";
import type { ArchiveEntryKind } from "./archive-plan.js";
export type ZipRead = {
    offset: number;
    length: number;
};
export type ZipScan = Generator<ZipRead, number, Buffer>;
export type ZipDirectoryEntry = {
    index: number;
    creatorSystem: number;
    externalAttributes: number;
    size: number;
    compressedSize: number;
    compressionMethod: number;
    crc32: number;
    path?: string;
    portableKey: string;
    portableDirectory: boolean;
    kind: ArchiveEntryKind;
};
export declare function scanZipDirectory(size: number, limits: ResolvedArchiveExtractLimits, onEntry?: (entry: ZipDirectoryEntry) => void): ZipScan;
