export type ExternalFileWriteOptions<T = void> = {
    rootDir: string;
    path: string;
    write: (filePath: string) => Promise<T>;
    maxBytes?: number;
    mode?: number;
    staging?: "workspace" | "sibling";
    /** Isolate sibling producers; workspace staging is already private. */
    producerIsolation?: "private-directory";
    fallbackFileName?: string;
};
export type ExternalFileWriteResult<T = void> = {
    path: string;
    result: T;
};
export declare function writeExternalFileWithinRoot<T = void>(options: ExternalFileWriteOptions<T>): Promise<ExternalFileWriteResult<T>>;
