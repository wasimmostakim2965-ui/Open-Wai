import { FsSafeError } from "./errors.js";
export declare class MutationAuthorityError extends FsSafeError {
    readonly rejection: unknown;
    constructor(rejection: unknown);
}
export declare function isMutationAuthorityError(error: unknown): error is MutationAuthorityError;
export declare function assertSynchronousCallbackResult(returned: unknown, name: string): void;
export declare function composeMutationAssertions(defaultAssertion?: () => void, callAssertion?: () => void): (() => void) | undefined;
export declare function rethrowMutationAuthorityError(error: unknown): never;
