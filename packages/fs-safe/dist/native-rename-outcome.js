export const NATIVE_RENAME_SOURCE_IDENTITY_MISMATCH = "FS_SAFE_INTERNAL_RENAME_SOURCE_IDENTITY_MISMATCH";
export function classifyNativeRenameFailure(error) {
    try {
        if (error?.code === NATIVE_RENAME_SOURCE_IDENTITY_MISMATCH) {
            return "uncommitted";
        }
    }
    catch {
        // Unreadable diagnostics cannot prove that the rename was uncommitted.
    }
    // Ordinary errno can follow a committed remote rename whose reply was lost.
    return "indeterminate";
}
