export type ProbePathSuffixAliasesOptions = {
    directory: string;
    left: string;
    right: string;
    /** Maximum relative component count; defaults to 32. */
    maxDepth?: number;
    /** Synchronous caller policy for differing NFC pairs not equivalent under ASCII case folding. */
    shouldProbeCaseVariants?: (leftNfc: string, rightNfc: string) => boolean;
};
/** Observe bounded missing suffix aliases; the caller owns caching and ambiguity policy. */
export declare function probePathSuffixAliasesSync(options: ProbePathSuffixAliasesOptions): boolean | undefined;
