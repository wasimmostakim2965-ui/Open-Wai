export declare function queueDirectories(queueDir: string, failedDir: string): Promise<{
    queue: QueueDirectory;
    failed: QueueDirectory;
}>;
declare class QueueDirectory {
    private readonly dir;
    private readonly root;
    private readonly allowSymlinkBase;
    constructor(dir: string);
    ensure(): Promise<void>;
    assert(allowMissing?: boolean): Promise<void>;
}
export declare function syncQueueDirectoryCreation(dir: string, validationBase: string): Promise<void>;
export {};
