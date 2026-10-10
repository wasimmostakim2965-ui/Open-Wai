import type { PinnedWriteInput } from "./pinned-write-types.js";
import type { RootCreateOptions, RootCreateStreamOptions, RootWriteOptions } from "./root-options.js";
declare const exclusiveSidecarCreate: unique symbol;
export declare const sidecarExclusiveCreate: Readonly<{
    [exclusiveSidecarCreate]: true;
}>;
export type RootWriteParams = RootWriteOptions & RootCreateOptions & RootCreateStreamOptions & {
    relativePath: string;
    data: string | Buffer | AsyncIterable<Uint8Array>;
    strictFileSync?: boolean;
    [exclusiveSidecarCreate]?: true;
};
export declare function rethrowCreateInputError(error: unknown): never;
export declare function createInputOptions(data: RootWriteParams["data"], options: RootCreateOptions & RootCreateStreamOptions, defaultMaxBytes?: number): RootCreateOptions & RootCreateStreamOptions;
export declare function rootWriteInput(params: RootWriteParams): PinnedWriteInput;
export {};
