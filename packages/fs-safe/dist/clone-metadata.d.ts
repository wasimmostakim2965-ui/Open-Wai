export type CloneFileMetadata = {
    dev: number;
    type: number;
    mtimeSec: number;
    mtimeNs: number;
    ctimeSec: number;
    ctimeNs: number;
    uid: number;
    gid: number;
    mode: number;
    ino: bigint;
    size: bigint;
    cloneId: bigint;
};
/** Batched APFS metadata snapshots; absent on unsupported files or filesystems.
 * On macOS, these snapshots require the native helper.
 * These are point-in-time facts, not authorization or a guarantee against later edits.
 */
export declare function readCloneFileMetadata(files: readonly string[]): Promise<(CloneFileMetadata | undefined)[]>;
