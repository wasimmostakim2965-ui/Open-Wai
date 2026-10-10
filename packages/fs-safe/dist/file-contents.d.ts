export type SameFileContentsOptions = {
    maxBytes?: number;
};
/** Compares borrowed regular files from offset zero without moving or closing either descriptor. */
export declare function sameFileContentsSync(leftFd: number, rightFd: number, options?: SameFileContentsOptions): boolean;
