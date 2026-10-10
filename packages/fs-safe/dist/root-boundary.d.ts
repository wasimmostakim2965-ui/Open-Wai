export declare function sameNormalizedPathSpelling(left: string, right: string): boolean;
export type RootBoundaryIdentity = Readonly<{
    dev: number | bigint;
    ino: number | bigint;
}>;
export type AdmittedRootPath = Readonly<{
    path: string;
    relativePath: string;
    admission: "exact" | "identity";
}>;
/**
 * Admit a path at a trusted directory boundary.
 *
 * On Windows, an exact structural prefix is allocation-only and performs no
 * filesystem observation. A match which depends on case folding is accepted
 * only when the candidate prefix names the exact trusted root object. Accepted
 * paths are always returned under the trusted root spelling.
 */
export declare function admitPathInsideRoot(params: {
    rootPath: string;
    candidatePath: string;
    rootIdentity?: RootBoundaryIdentity;
    resolveCandidateRoot?: boolean;
    identityCache?: Map<string, boolean>;
    inspectCandidateRoot?: (candidateRootPath: string, expected: Readonly<{
        dev: bigint;
        ino: bigint;
    }>) => void;
}): AdmittedRootPath | undefined;
