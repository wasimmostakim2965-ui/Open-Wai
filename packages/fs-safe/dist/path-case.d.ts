export type ProbePathCaseOptions = {
    /** Allow an exclusively created empty probe when existing entries provide no answer. Defaults to true. */
    allowTemporaryProbe?: boolean;
};
/** Observe local ASCII case behavior; unknown observations never imply an operating-system default. */
export declare function probePathCaseInsensitiveSync(targetPath: string, options?: ProbePathCaseOptions): boolean | undefined;
