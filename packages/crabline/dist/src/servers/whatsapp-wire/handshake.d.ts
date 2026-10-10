import { Buffer } from "node:buffer";
export type HandshakeMessage = {
    clientFinish?: {
        extendedCiphertext?: Buffer;
        payload?: Buffer;
        staticKey?: Buffer;
    };
    clientHello?: {
        ephemeral?: Buffer;
        extendedCiphertext?: Buffer;
        payload?: Buffer;
        staticKey?: Buffer;
        useExtended?: boolean;
    };
    serverHello?: {
        ephemeral?: Uint8Array;
        extendedStatic?: Uint8Array;
        payload?: Uint8Array;
        staticKey?: Uint8Array;
    };
};
export declare function decodeHandshakeMessage(data: Uint8Array): HandshakeMessage;
export declare function encodeHandshakeMessage(message: HandshakeMessage): Buffer;
