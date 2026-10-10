export declare function safeDirName(input: string): string;
/** Legacy readable encoding; distinct IDs can share a result. Use V2 for untrusted IDs. */
export declare function safePathSegmentHashed(input: string): string;
/**
 * Versioned install-ID encoding: every trimmed ID receives a domain-separated
 * SHA-256 digest. Only surrounding whitespace is intentionally equivalent.
 */
export declare function safePathSegmentHashedV2(input: string): string;
export declare function resolveSafeInstallDir(params: {
    baseDir: string;
    id: string;
    invalidNameMessage: string;
    nameEncoder?: (id: string) => string;
}): {
    ok: true;
    path: string;
} | {
    ok: false;
    error: string;
};
export declare function assertCanonicalPathWithinBase(params: {
    baseDir: string;
    candidatePath: string;
    boundaryLabel: string;
}): Promise<void>;
