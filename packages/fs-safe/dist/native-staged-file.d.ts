import type { DirectoryReceipt } from "./directory-durability.js";
import { type BigIntStats, type Stats } from "node:fs";
import type { AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { FileIdentityStat } from "./file-identity.js";
import { type NativeBinding } from "./native-binding.js";
import type { PinnedWriteInput, PinnedWriteParams } from "./pinned-write-types.js";
import type { PublishedFileReceipt, StagedFile, StagedFileCleanupReceipt, StagedFileReceipt } from "./staged-file-types.js";
export type NativeStagingBinding = NativeBinding & Required<Pick<NativeBinding, "createStagedFile" | "stagedFileMatches" | "removeStagedFile">>;
export declare function assertNativeStaging(binding: NativeBinding): asserts binding is NativeStagingBinding;
type StagedPermissionPolicy = "private-creation" | "mode-only";
type NativeStageOwner = Readonly<{
    binding: NativeStagingBinding;
    parentFd: number;
    closeParentFd: (fd: number) => void;
    directory: StagedFileReceipt["directory"];
    portableNames?: boolean;
    mode: number;
    sync?: boolean;
    strictFileSync?: boolean;
    assertBeforeMutation?: () => void;
    permissionPolicy?: StagedPermissionPolicy;
    name?: string;
}>;
declare class NativeStagedFile implements StagedFile {
    #private;
    constructor(owner: NativeStageOwner);
    static create(owner: NativeStageOwner, input: PinnedWriteInput, maxBytes?: number): Promise<NativeStagedFile>;
    static write(binding: NativeStagingBinding, parentFd: number, closeParentFd: (fd: number) => void, directory: StagedFileReceipt["directory"], params: PinnedWriteParams, parentGuard: AnyAsyncDirectoryGuard): Promise<FileIdentityStat>;
    get receipt(): StagedFileReceipt;
    assertCurrent(): Promise<void>;
    publish(basename: string, options: {
        overwrite: boolean;
    }, onPublished?: PinnedWriteParams["onPublished"]): Promise<PublishedFileReceipt>;
    cleanup(): Promise<StagedFileCleanupReceipt>;
    [Symbol.asyncDispose](): Promise<void>;
}
export declare const createNativeStage: (...args: Parameters<typeof NativeStagedFile.create>) => Promise<StagedFile>;
export declare const writeNativeStage: typeof NativeStagedFile.write;
export declare function stageFileInDirectory(options: {
    directory: string | DirectoryReceipt<Stats | BigIntStats>;
    content: string | Uint8Array;
    /** Published mode; the unpublished stage stays at 0600. Defaults to 0600. */
    mode?: number;
}): Promise<StagedFile>;
export {};
