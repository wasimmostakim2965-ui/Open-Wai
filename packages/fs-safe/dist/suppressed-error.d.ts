export type SuppressedErrorLike = Error & {
    error: unknown;
    suppressed: unknown;
};
export declare function createSuppressedError(error: unknown, suppressed: unknown, message: string): SuppressedErrorLike;
