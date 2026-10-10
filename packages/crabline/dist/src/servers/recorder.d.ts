import { type WindowsDirectorySecuritySnapshot } from "../platform/windows-acl.js";
import type { ServerRequestEvent } from "./http.js";
export type ServerEventObserver = (event: ServerRequestEvent) => void | Promise<void>;
export declare class ServerRecorderCommittedError extends AggregateError {
    readonly committed = true;
    readonly indeterminate: boolean;
    constructor(filePath: string, operationError: unknown, relatedErrors?: unknown[], indeterminate?: boolean);
}
export declare function secureServerRecorderWindowsLockRoot(root: string, options?: {
    createWindowsDirectory?: (directoryPath: string) => Promise<void>;
    readWindowsDirectorySecuritySnapshot?: (directoryPath: string) => Promise<WindowsDirectorySecuritySnapshot>;
}): Promise<string>;
export declare function serverRecorderWindowsLockPath(root: string, filePath: string): string;
type RecorderAppendResult = {
    observation: Promise<void>;
};
type ServerRecorderWrite = {
    event: ServerRequestEvent;
    onEvent: ServerEventObserver | undefined;
    recorderPath: string;
};
export declare function recordServerEvent(params: ServerRecorderWrite, pending?: Set<Promise<RecorderAppendResult>>): Promise<void>;
export declare function recordCommittedServerEvent(params: ServerRecorderWrite, pending?: Set<Promise<RecorderAppendResult>>): Promise<void>;
/** Runs a read while recorder admissions and cross-process appends are blocked at a record boundary. */
export declare function withServerRecorderSnapshot<T>(params: {
    read: () => Promise<T>;
    recorderPath: string;
}): Promise<T>;
export type ServerRecorder = {
    record(event: ServerRequestEvent): Promise<void>;
    recordCommitted(event: ServerRequestEvent): Promise<void>;
    close(): Promise<void>;
};
export declare function createServerRecorder(params: {
    recorderPath: string;
    onEvent: ServerEventObserver | undefined;
}): ServerRecorder;
export {};
