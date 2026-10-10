export type ReadyFileIdentity = {
    birthtimeNs: bigint;
    ctimeNs: bigint;
    dev: bigint;
    ino: bigint;
    size: bigint;
};
export declare function acquireReadyFileLease(filePath: string): Promise<() => Promise<void>>;
export declare function publishReadyFile(filePath: string, contents: string): Promise<ReadyFileIdentity>;
export declare function publishReadyFileUnlocked(filePath: string, contents: string): Promise<ReadyFileIdentity>;
export declare function removeReadyFileIfOwned(filePath: string, expectedContents: string, expectedIdentity: ReadyFileIdentity): Promise<void>;
export declare function removeReadyFile(filePath: string, expectedContents: string, expectedIdentity: ReadyFileIdentity): Promise<void>;
