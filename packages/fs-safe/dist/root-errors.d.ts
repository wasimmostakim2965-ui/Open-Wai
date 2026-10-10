import { FsSafeError, type FsSafeErrorDetails } from "./errors.js";
export declare function fileNotFoundError(cause?: unknown, details?: FsSafeErrorDetails): FsSafeError;
export declare function outsideWorkspaceError(): FsSafeError;
export declare function rootPathChangedError(cause?: Error): FsSafeError;
export declare function directoryComponentNotDirectoryError(cause?: unknown): FsSafeError;
export declare function hardlinkedPathNotAllowedError(): FsSafeError;
export declare function isAlreadyExistsError(error: unknown): boolean;
export declare function normalizePinnedWriteError(error: unknown): Error;
export declare function normalizePinnedPathError(error: unknown, details?: FsSafeErrorDetails): Error;
export declare function normalizeRemoveGuardError(error: unknown, details?: FsSafeErrorDetails): Error;
export declare function normalizeRemovePathError(error: unknown, details?: FsSafeErrorDetails): Error;
export declare function throwFsSafeReadError(error: unknown, label: string): never;
/** Existing boundaries retain only Error instances as their cause. */
export declare function errorCauseOptions(error: unknown): {
    cause: Error | undefined;
};
