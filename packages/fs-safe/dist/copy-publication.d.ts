import type { BigIntStats } from "node:fs";
import type { PinnedWriteParams, PublishedWriteIdentity } from "./pinned-write-types.js";
export type RootCopyPublicationReceipt = Readonly<PublishedWriteIdentity & {
    path: string;
}>;
export declare function createCopyPublicationObserver(path: string, notify?: (receipt: RootCopyPublicationReceipt) => void): {
    onPublished(identity: PublishedWriteIdentity): void;
    rethrowObserverFailure(error: unknown): void;
};
export declare const onCopyPublication: unique symbol;
export declare const onCopySourceAdmission: unique symbol;
export type CopyPublicationOptions = {
    [onCopyPublication]?: PinnedWriteParams["verifyPublished"];
    [onCopySourceAdmission]?: (identity: BigIntStats, realPath: string) => {
        mode: number;
        verify(): void;
    };
};
