import type { RenameIdentityPolicy } from "./pinned-write-types.js";
export declare function validateRenameIdentity(policy: RenameIdentityPolicy | undefined): void;
export declare function atomicExpectedContentHash(policy: RenameIdentityPolicy | undefined, content: string | Uint8Array): string | undefined;
export declare function withAtomicRenameIdentityLock<T>(filePath: string, fn: () => Promise<T>): Promise<T>;
export declare function withAtomicRenameIdentityLockSync<T>(filePath: string, fn: () => T): T;
