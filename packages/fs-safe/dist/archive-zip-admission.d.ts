import type { ExtractionDeadline } from "./archive-deadline.js";
import { type ResolvedArchiveExtractLimits } from "./archive-limits.js";
import { type ZipDirectoryEntry } from "./archive-zip-directory.js";
/** Admit physical records before a decoder can normalize or collapse names. */
export declare function admitZipBuffer(input: Uint8Array, limits: ResolvedArchiveExtractLimits, onEntry?: (entry: ZipDirectoryEntry) => void): number;
/** The extraction input is private and immutable; read bounded metadata windows. */
export declare function admitZipFile(archivePath: string, limits: ResolvedArchiveExtractLimits, deadline: ExtractionDeadline, onEntry?: (entry: ZipDirectoryEntry) => void): Promise<number>;
