export type WriteSiblingTempFileOptions<T> = {
    dir: string;
    writeTemp: (tempPath: string) => Promise<T>;
    /** Own a private sibling workspace before invoking the producer. */
    producerIsolation?: "private-directory";
    resolveFinalPath: (result: T) => string;
    tempPrefix?: string;
    dirMode?: number;
    chmodDir?: boolean;
    /** Final file mode; omitted preserves the producer's mode. Applied through the retained descriptor. */
    mode?: number;
    /** Sync the staged descriptor before rename; defaults to false. */
    syncTempFile?: boolean;
    /** Best-effort parent directory sync after rename; defaults to false. */
    syncParentDir?: boolean;
};
export type WriteSiblingTempFileResult<T> = {
    filePath: string;
    result: T;
};
export declare function writeSiblingTempFile<T>(options: WriteSiblingTempFileOptions<T>): Promise<WriteSiblingTempFileResult<T>>;
export declare function writeViaSiblingTempPath(params: {
    rootDir: string;
    targetPath: string;
    writeTemp: (tempPath: string) => Promise<void>;
    fallbackFileName?: string;
    tempPrefix?: string;
}): Promise<void>;
