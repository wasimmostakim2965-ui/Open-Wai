import { type WindowsDirectorySecuritySnapshot } from "../platform/windows-acl.js";
import type { InboundEnvelope } from "./types.js";
export type RecordableInboundEnvelope = InboundEnvelope & {
    recordedDirection?: "inbound" | "outbound";
};
export type RecordedInboundEnvelope = RecordableInboundEnvelope & {
    recordedAt: string;
};
export declare class ProviderRecorderCommittedError extends AggregateError {
    readonly committed = true;
    readonly indeterminate = true;
    constructor(filePath: string, cause: unknown, relatedErrors?: unknown[]);
}
type IncrementalReadState = {
    caughtUp: boolean;
    continuity: Buffer;
    generation: number;
    identity: {
        dev: bigint;
        ino: bigint;
    } | undefined;
    offset: number;
    pending: Buffer;
};
export type RecordedInboundCursor = {
    buffered: RecordedInboundEnvelope[];
    readState: IncrementalReadState;
    seen: Set<string>;
};
export declare function createRecordedInboundCursor(): RecordedInboundCursor;
export declare function cloneRecordedInboundCursor(cursor: RecordedInboundCursor): RecordedInboundCursor;
export declare function secureProviderRecorderLockRoot(root: string, currentUserId: number | undefined, options?: {
    platform?: NodeJS.Platform;
    createWindowsDirectory?: (directoryPath: string) => Promise<void>;
    readWindowsDirectorySecuritySnapshot?: (directoryPath: string) => Promise<WindowsDirectorySecuritySnapshot>;
}): Promise<string>;
export declare function appendRecordedInbound(filePath: string, event: RecordableInboundEnvelope): Promise<RecordedInboundEnvelope>;
export declare function appendRecordedInboundBatch(filePath: string, events: RecordableInboundEnvelope[]): Promise<RecordedInboundEnvelope[]>;
export declare function readRecordedInbound(filePath: string): Promise<RecordedInboundEnvelope[]>;
export declare function waitForRecordedInbound(params: {
    cursor?: RecordedInboundCursor | undefined;
    filePath: string;
    matches: (event: RecordedInboundEnvelope) => boolean;
    pollMs?: number;
    recordedDirection?: "inbound" | "outbound" | undefined;
    signal?: AbortSignal | undefined;
    since?: string | undefined;
    timeoutMs: number;
}): Promise<RecordedInboundEnvelope | null>;
export declare function watchRecordedInbound(params: {
    filePath: string;
    matches: (event: RecordedInboundEnvelope) => boolean;
    pollMs?: number;
    recordedDirection?: "inbound" | "outbound" | undefined;
    signal?: AbortSignal | undefined;
    since?: string | undefined;
}): AsyncIterable<RecordedInboundEnvelope>;
export {};
