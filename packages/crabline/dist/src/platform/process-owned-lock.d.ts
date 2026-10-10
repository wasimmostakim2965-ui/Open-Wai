import fs from "node:fs";
export declare function isDeadLinuxProcessState(value: string): boolean;
type ProcessOwnedLockOptions = {
    beforeDirectoryRemoval?: (directoryPath: string) => void;
    machineIdentityReader?: () => string | null;
    onDirectoryOwned?: (directoryPath: string, identity: {
        dev: bigint;
        ino: bigint;
    }) => void;
    processIdentityReader?: (pid: number) => string | null;
};
export declare function initializeProcessOwnedLockIdentity(): void;
export declare function createProcessOwnedLockFileSystem(options?: ProcessOwnedLockOptions): typeof fs;
export {};
