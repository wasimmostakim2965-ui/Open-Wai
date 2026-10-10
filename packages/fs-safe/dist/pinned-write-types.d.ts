import type { CopyFileInput } from "./copy-file-input.js";
import type { AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { FileIdentityStat } from "./file-identity.js";
import type { MutationDirectoryObservation } from "./pinned-mutation-observation.js";
export type PinnedWriteInput = {
    kind: "buffer";
    data: string | Buffer;
    encoding?: BufferEncoding;
    stageBeforePublish?: boolean;
} | {
    kind: "stream";
    stream: AsyncIterable<Uint8Array | string>;
    stageBeforePublish?: boolean;
} | CopyFileInput;
export type RenameIdentityPolicy = "strict" | "verify-content-with-lock";
export type PublishedWriteIdentity = Readonly<{
    dev: bigint;
    ino: bigint;
}>;
export type PinnedMutationAdmissionReceipt = Readonly<object>;
export type PinnedMutationAuthorizationToken = Readonly<object>;
export type PinnedCreatedDirectoryReceipt = Readonly<{
    admission: PinnedMutationAdmissionReceipt;
    parent: MutationDirectoryObservation;
    child: MutationDirectoryObservation;
}>;
export type PinnedMutationParentRequest = {
    targetPath: string;
    mutationPath: string;
    phase: "parent" | "parent-create";
};
export type PinnedMutationParentWalkSession = Readonly<{
    retainedTargetPath: string;
    tryAuthorizeAtParent(request: Readonly<PinnedMutationParentRequest>, parent: MutationDirectoryObservation): PinnedMutationAuthorizationToken | undefined;
    authorize(request: Readonly<PinnedMutationParentRequest>): Promise<PinnedMutationAdmissionReceipt | undefined>;
    advanceCreatedDirectory(receipt: PinnedCreatedDirectoryReceipt): PinnedMutationAuthorizationToken | undefined;
    dispose(): void;
}>;
export type PinnedWriteMutationAdmission = Readonly<{
    rejectParentSymlinks: boolean;
    beginParentWalk?(): string | undefined;
    beginSharedParentWalk?(): PinnedMutationParentWalkSession | undefined;
    beginNativeParentWalk?(): PinnedMutationParentWalkSession | undefined;
    tryAuthorizeAtParent?(request: Readonly<PinnedMutationParentRequest>, parent: MutationDirectoryObservation): PinnedMutationAuthorizationToken | undefined;
    authorize(request: Readonly<PinnedMutationParentRequest>): Promise<PinnedMutationAdmissionReceipt | undefined>;
    advanceCreatedDirectory?(receipt: PinnedCreatedDirectoryReceipt): PinnedMutationAuthorizationToken | undefined;
}>;
export type PinnedWriteParams = {
    rootPath: string;
    relativeParentPath: string;
    basename: string;
    mkdir: boolean;
    mode: number;
    private?: boolean;
    verifyPosixMode?: boolean;
    sync?: boolean;
    strictFileSync?: boolean;
    overwrite?: boolean;
    assertBeforeMutation?: () => void;
    rejectFinalSymlink?: boolean;
    maxBytes?: number;
    input: PinnedWriteInput;
    rootIdentity?: FileIdentityStat;
    mutationAdmission?: PinnedWriteMutationAdmission;
    onRenameIdentityMismatch?: "verify-content";
    onPublished?: (identity: PublishedWriteIdentity) => void;
    verifyPublished?: (fd: number, identity: PublishedWriteIdentity, parentGuard: AnyAsyncDirectoryGuard) => Promise<void>;
};
