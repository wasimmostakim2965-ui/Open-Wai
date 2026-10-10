export type MovePathPublicationReceipt = Readonly<{
    path: string;
    dev: bigint;
    ino: bigint;
}>;
export type MovePathWithCopyFallbackOptions = {
    /** Rechecks authority before each rename and copied-source unlink/rmdir dispatch. */
    assertBeforeMutation?: () => void;
    /** Rechecks caller authority synchronously immediately before each rename dispatch. */
    assertBeforeRename?: () => void;
    /** Reports the committed destination before post-rename checks or source cleanup. */
    onDestinationPublished?: (receipt: MovePathPublicationReceipt) => void;
    from: string;
    sourceHardlinks?: "allow" | "reject";
    to: string;
};
type MoveCopyFallbackReason = "cross-device" | "windows-rename-denied";
export declare function moveCopyFallbackReasonForRenameError(error: unknown, platform?: NodeJS.Platform): MoveCopyFallbackReason | undefined;
export declare function movePathWithCopyFallback(options: MovePathWithCopyFallbackOptions): Promise<void>;
export {};
