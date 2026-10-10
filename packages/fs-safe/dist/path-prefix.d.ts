export type ResolvedPathPrefix = {
    readonly absolutePath: string;
    readonly existingPath: string;
    readonly unresolvedSegments: readonly string[];
};
export declare function resolvePathPrefixSync(input: string): ResolvedPathPrefix;
