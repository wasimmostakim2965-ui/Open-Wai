/** Strip only trailing separators: lstat must inspect the entry, not follow a leaf link. */
export declare function directoryEntryPath(dir: string, platform?: NodeJS.Platform): string;
