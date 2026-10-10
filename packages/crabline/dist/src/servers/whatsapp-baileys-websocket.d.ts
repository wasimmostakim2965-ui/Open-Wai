import { Buffer } from "node:buffer";
import type { Server } from "node:http";
import { type KeyPair, type SignedKeyPair } from "./whatsapp-wire/crypto.js";
import { type BinaryNode } from "./whatsapp-wire/binary-node.js";
import type { ServerRequestEvent } from "./http.js";
export declare const MAX_WHATSAPP_NOISE_FRAME_BYTES: number;
export declare const MAX_WHATSAPP_WEBSOCKET_BUFFERED_BYTES: number;
export declare const MAX_WHATSAPP_WEBSOCKET_MESSAGE_BYTES: number;
export declare const MAX_WHATSAPP_NOISE_BUFFER_CHUNKS = 1024;
export declare const MAX_WHATSAPP_NOISE_FRAMES_PER_MESSAGE = 1024;
export declare const WHATSAPP_WEBSOCKET_SEND_TIMEOUT_MS = 5000;
export declare const MAX_WHATSAPP_WEBSOCKET_FRAGMENTS = 1024;
export declare const MAX_WHATSAPP_SIGNAL_BUNDLES = 1024;
export declare const MAX_WHATSAPP_SIGNAL_PREKEYS_PER_BUNDLE = 32;
export declare const MAX_WHATSAPP_SIGNAL_SESSIONS_PER_BUNDLE = 32;
export declare const MAX_WHATSAPP_WEBSOCKET_CLOSE_REASON_BYTES = 123;
export declare const WHATSAPP_MESSAGE_ACCEPTANCE_TIMEOUT_MS = 5000;
export declare const WHATSAPP_SIGNAL_PREKEY_RESERVATION_TTL_MS: number;
type NodeBuffer = Buffer<ArrayBufferLike>;
type WhatsAppWebSocketRawData = NodeBuffer | ArrayBuffer | NodeBuffer[];
type WhatsAppWebSocketSendTarget = {
    bufferedAmount: number;
    readyState: number;
    send(data: Uint8Array, callback: (error?: Error) => void): void;
    terminate(): void;
};
export type WhatsAppBaileysWebSocketServer = {
    close(): Promise<void>;
    prepareInboundMessage(message: WhatsAppBaileysInboundMessage): PreparedWhatsAppBaileysInboundDelivery | undefined;
};
export type WhatsAppBaileysWebSocketServerParams = {
    accessToken: string;
    appendEvent(event: ServerRequestEvent): Promise<void>;
    httpServer: Server;
    maxPendingInboundMessages?: number | undefined;
    messageAcceptanceTimeoutMs?: number | undefined;
    path: string;
    selfJid: string;
};
export type PreparedWhatsAppBaileysInboundDelivery = {
    cancel(): void;
    commit(): Promise<"delivered" | "queued">;
};
export type WhatsAppBaileysInboundMessage = {
    key: {
        fromMe: boolean;
        id: string;
        participant?: string | undefined;
        remoteJid: string;
    };
    message: {
        audioMessage?: never;
        conversation: string;
    } | {
        audioMessage: WhatsAppBaileysAudioMessage;
        conversation?: never;
    };
    messageTimestamp: number;
    pushName?: string | undefined;
};
export type WhatsAppBaileysAudioMessage = {
    fileEncSha256: Buffer;
    fileLength: number;
    fileSha256: Buffer;
    mediaKey: Buffer;
    mediaKeyTimestamp: number;
    mimetype: string;
    ptt: boolean;
    seconds?: number | undefined;
    url: string;
};
export declare function resolveMaxPendingWhatsAppInboundMessages(value: number | undefined): number;
export type MockSignalBundle = {
    identityKey: KeyPair;
    preKey: KeyPair;
    preKeyId: number;
    registrationId: number;
    signedPreKey: SignedKeyPair;
};
export type WhatsAppSignalDecryptResult<T> = {
    status: "accepted";
    value: T;
} | {
    error: unknown;
    status: "decrypt-failed";
} | {
    status: "unavailable";
} | {
    status: "rejected";
};
export type WhatsAppSignalBundleStoreOptions = {
    maxPreKeysPerBundle?: number | undefined;
    maxSessionsPerBundle?: number | undefined;
    messageAcceptanceTimeoutMs?: number | undefined;
    preKeyReservationTtlMs?: number | undefined;
};
type WhatsAppMessageAcceptanceOptions = {
    onTerminalTimeout?: (() => void) | undefined;
    signal?: AbortSignal | undefined;
    terminalDrain?: (() => Promise<"acknowledged" | "persisted" | "retryable">) | undefined;
    timeoutMs?: number | undefined;
};
export declare class WhatsAppSignalBundleStore {
    #private;
    private readonly maxBundles;
    private readonly maxPendingAcknowledgements;
    private readonly maxRecentAcknowledgements;
    private readonly maxPendingAcknowledgementAgeMs;
    private readonly now;
    constructor(maxBundles?: number, maxPendingAcknowledgements?: number, maxRecentAcknowledgements?: number, maxPendingAcknowledgementAgeMs?: number, now?: () => number, options?: WhatsAppSignalBundleStoreOptions);
    get size(): number;
    get lidMappingSize(): number;
    get sessionCount(): number;
    acceptMessageOnce(messageKey: string, operation: (signal: AbortSignal) => Promise<boolean>, options?: WhatsAppMessageAcceptanceOptions): Promise<boolean>;
    markMessageAcknowledged(peerJid: string, messageId: string): void;
    hasPersistedMessage(messageKey: string): boolean;
    clearPersistedMessage(messageKey: string): void;
    releaseMessagePreKeyProtection(messageKey: string): void;
    associateLid(phoneNumberJid: string, lidJid: string): void;
    resolveAssociatedLid(phoneNumberJid: string): string | undefined;
    resolveMany(jids: string[]): MockSignalBundle[];
    decryptDirectMessage(params: {
        ciphertext: Uint8Array;
        recipientJid: string;
        remoteJid: string;
        type: "msg" | "pkmsg";
    }): Promise<Buffer | undefined>;
    transactDirectMessage<T>(params: {
        accept(plaintext: Buffer): Promise<T | undefined>;
        ciphertext: Uint8Array;
        messageKey?: string | undefined;
        recipientJid: string;
        remoteJid: string;
        signal?: AbortSignal | undefined;
        type: "msg" | "pkmsg";
    }): Promise<WhatsAppSignalDecryptResult<T>>;
}
export declare function createSerializedMessageHandler<T>(processMessage: (message: T) => Promise<void>, onError: (error: unknown) => void, options?: {
    maxPendingBytes?: number | undefined;
    maxPendingMessages?: number | undefined;
    sizeOf?: ((message: T) => number) | undefined;
}): (message: T) => Promise<void>;
export declare class WhatsAppNoiseFrameDecoder {
    #private;
    get bufferedBytes(): number;
    decodeFrames(data: WhatsAppWebSocketRawData): NodeBuffer[];
}
export declare function sendWhatsAppWebSocketPayload(socket: WhatsAppWebSocketSendTarget, payload: Uint8Array): Promise<void>;
export declare function resolveWhatsAppWebSocketClose(error: unknown): {
    code: 1002 | 1009 | 1011;
    reason: string;
};
export declare function attachWhatsAppBaileysWebSocketServer(params: WhatsAppBaileysWebSocketServerParams): WhatsAppBaileysWebSocketServer;
export declare function parseWhatsAppWebSocketUpgradeUrl(requestTarget: string | undefined): URL | undefined;
export declare function persistAcceptedBaileysMessage(params: {
    acceptanceSignal?: AbortSignal | undefined;
    appendEvent(event: ServerRequestEvent): Promise<void>;
    node: BinaryNode;
    onAcceptanceTimeout?: (() => void) | undefined;
    path: string;
    remoteJid: string;
    signalBundles: WhatsAppSignalBundleStore;
}): Promise<boolean>;
export declare function signalBundleIdentityKey(jid: string): string;
export {};
