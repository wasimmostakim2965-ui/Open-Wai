import { type ArchiveExtractLimits } from "./archive-limits.js";
import { type ZipArchiveAdmission, type ZipArchiveWithFiles } from "./archive-zip-loader.js";
export declare function loadZipArchiveWithAdmission(buffer: Buffer | Uint8Array, limits?: ArchiveExtractLimits): Promise<ZipArchiveAdmission>;
export declare function loadZipArchiveWithPreflight(buffer: Buffer | Uint8Array, limits?: ArchiveExtractLimits): Promise<ZipArchiveWithFiles>;
