import { type BigIntStats } from "node:fs";
type ExactDirectoryStat = Pick<BigIntStats, "dev" | "ino" | "uid" | "mode" | "isDirectory" | "isSymbolicLink">;
/** Complete, synchronous descriptor authority for secure-temp admission and repair. */
export type SecureTempRootDescriptorAdapter = {
    lstatSync(path: string, options: {
        bigint: true;
    }): ExactDirectoryStat;
    fstatSync(fd: number, options: {
        bigint: true;
    }): ExactDirectoryStat;
    openSync(path: string, flags: number): number;
    fchmodSync(fd: number, mode: number): void;
    closeSync(fd: number): void;
    constants: {
        O_RDONLY: number;
        O_DIRECTORY: number;
        O_NOFOLLOW: number;
        O_NONBLOCK: number;
    };
};
export type SecureTempDirectoryReceipt = Readonly<{
    dev: bigint;
    ino: bigint;
    uid: bigint;
    mode: bigint;
}>;
export type SecureTempRepairAdapter = Omit<SecureTempRootDescriptorAdapter, "constants"> & {
    flags: number;
};
export declare function captureSecureTempRepairAdapter(supplied: SecureTempRootDescriptorAdapter | undefined, hasLegacyFsHooks: boolean): SecureTempRepairAdapter | undefined;
export declare function secureTempDirectoryReceipt(stat: ExactDirectoryStat, uid: number): SecureTempDirectoryReceipt;
/** No pathname chmod, search-only descriptors, procfs, or reopening fallback. */
export declare function repairSecureTempDirectory(candidate: string, expected: SecureTempDirectoryReceipt, uid: number, adapter: SecureTempRepairAdapter, access: () => void, repaired: () => void, finalize?: boolean): void;
export {};
