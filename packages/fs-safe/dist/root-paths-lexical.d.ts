import { type ResolvePathWithinRootParams } from "./path-scope-lexical.js";
export declare function invalidPath(scopeLabel: string): {
    ok: false;
    error: string;
};
export declare function resolvePathWithinRoot(params: ResolvePathWithinRootParams): {
    ok: true;
    path: string;
} | {
    ok: false;
    error: string;
};
