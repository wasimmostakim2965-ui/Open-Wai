import type { RetainedFileAdmission, RetainFileInDirectoryOptions } from "./retained-file-types.js";
/** Retain one existing regular file on supported local Windows NTFS. No fallback. */
export declare function retainFileInDirectory(options: RetainFileInDirectoryOptions): RetainedFileAdmission;
