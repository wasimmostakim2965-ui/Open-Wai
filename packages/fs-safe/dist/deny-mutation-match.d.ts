/** Cache observations only within one synchronous policy check, never across mutations or callbacks. */
export declare function createMutationDenyMatcher(): (target: string, denied: string, prefix: boolean, protectAncestors?: boolean) => boolean;
