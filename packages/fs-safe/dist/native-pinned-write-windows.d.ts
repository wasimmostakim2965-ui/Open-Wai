import type { FileHandle } from "node:fs/promises";
import { type AnyAsyncDirectoryGuard } from "./directory-guard.js";
import type { FileIdentityStat } from "./file-identity.js";
import type { NativeBinding } from "./native.js";
import type { PinnedWriteParams } from "./pinned-write-types.js";
export declare function runPinnedWriteWindows(binding: NativeBinding, params: PinnedWriteParams, root: FileHandle, parentFd: number, parentGuard: AnyAsyncDirectoryGuard): Promise<FileIdentityStat>;
