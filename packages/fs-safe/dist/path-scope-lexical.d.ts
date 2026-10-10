export type ResolvePathWithinRootParams = {
    rootDir: string;
    requestedPath: string;
    scopeLabel: string;
    defaultFileName?: string;
};
export declare function resolvePathWithinNormalizedRoot(params: ResolvePathWithinRootParams, root: string): {
    ok: true;
    path: string;
} | {
    ok: false;
    error: string;
};
