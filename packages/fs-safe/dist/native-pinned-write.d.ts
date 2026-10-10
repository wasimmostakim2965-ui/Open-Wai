import type { FileIdentityStat } from "./file-identity.js";
import type { NativeBinding } from "./native.js";
import type { PinnedWriteParams } from "./pinned-write-types.js";
export declare function runPinnedWriteNative(binding: NativeBinding, params: PinnedWriteParams): Promise<FileIdentityStat>;
