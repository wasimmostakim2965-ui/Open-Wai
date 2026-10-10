import type { FileIdentityStat } from "./file-identity.js";
import type { PinnedWriteParams, RenameIdentityPolicy } from "./pinned-write-types.js";
export declare function runPinnedWriteHelper(params: PinnedWriteParams): Promise<FileIdentityStat>;
export declare function runPinnedWriteWithRenamePolicy(params: PinnedWriteParams & {
    targetPath: string;
    renameIdentity?: RenameIdentityPolicy;
}): Promise<FileIdentityStat>;
export declare function withPinnedWriteRenameIdentityLock<T>(params: {
    rootPath: string;
    targetPath: string;
    relativeTargetPath: string;
}, run: () => Promise<T>): Promise<T>;
