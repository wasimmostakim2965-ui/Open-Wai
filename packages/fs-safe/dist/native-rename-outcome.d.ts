export declare const NATIVE_RENAME_SOURCE_IDENTITY_MISMATCH = "FS_SAFE_INTERNAL_RENAME_SOURCE_IDENTITY_MISMATCH";
export type NativeRenameFailureOutcome = "uncommitted" | "indeterminate";
export declare function classifyNativeRenameFailure(error: unknown): NativeRenameFailureOutcome;
