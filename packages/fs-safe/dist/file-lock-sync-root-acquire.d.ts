import type { FileLockSyncAcquireOptions, FileLockSyncHandle } from "./file-lock-sync.js";
import type { Root } from "./root-impl.js";
export declare function acquireFileLockSyncWithRoot<TPayload extends Record<string, unknown>>(targetPath: string, inputOptions: FileLockSyncAcquireOptions<TPayload>, lockRoot: Root): FileLockSyncHandle;
