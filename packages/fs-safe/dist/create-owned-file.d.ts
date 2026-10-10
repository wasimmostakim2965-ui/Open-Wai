export type OwnedFileDescriptorSync = {
    readonly fd: number;
    close(): void;
    [Symbol.dispose](): void;
};
/** Capture the descriptor's creator-owned closer before it can be reused. */
export declare function ownFileDescriptorSync(fd: number, closeFd?: (fd: number) => void): OwnedFileDescriptorSync;
