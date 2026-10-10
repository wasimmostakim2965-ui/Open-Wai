export type SafePathSegmentOptions = {
    allowDotPrefix?: boolean;
    label?: string;
};
export declare function isDriveRelativePath(value: string): boolean;
export declare function assertNoDriveRelativePathSegments(value: string, label: string): string;
export declare function trimHyphenEdges(value: string): string;
export declare function isSafePathSegment(segment: string, options?: SafePathSegmentOptions): boolean;
export declare function assertSafePathSegment(segment: string, options?: SafePathSegmentOptions): string;
export declare function normalizeSafePathSegment(value: string): string;
export declare function assertSafePathPrefix(prefix: string, options?: SafePathSegmentOptions): string;
