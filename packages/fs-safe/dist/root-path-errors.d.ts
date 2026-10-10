export declare function isRootPathEscapeError(error: unknown): error is Error;
export declare function sanitizeRootPathError(error: unknown): unknown;
export declare function pathEscapeError(params: {
    boundaryLabel: string;
    rootPath: string;
    absolutePath: string;
}): Error;
export declare function symlinkEscapeError(params: {
    boundaryLabel: string;
    rootCanonicalPath: string;
    symlinkPath: string;
}): Error;
