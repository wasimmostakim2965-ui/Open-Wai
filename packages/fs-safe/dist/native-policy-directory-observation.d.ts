import { FsSafeError } from "./errors.js";
import type { NativeBinding } from "./native-binding.js";
import type { MutationDirectoryObserver } from "./pinned-mutation-observation.js";
export declare class NativePolicyDirectoryMismatch extends FsSafeError {
    constructor(cause?: Error);
}
export type NativePolicyDirectoryObserver = MutationDirectoryObserver & {
    dispose(): void;
};
/** Fresh name/metadata/canonical facts from a caller-owned POSIX descriptor. */
export declare function nativePolicyDirectoryObserver(binding: NativeBinding | undefined, fd: number, pathname: string): NativePolicyDirectoryObserver | undefined;
