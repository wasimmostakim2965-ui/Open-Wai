export type FeishuFrame = {
    SeqID: string;
    LogID: string;
    service: number;
    method: number;
    headers: Array<{
        key: string;
        value: string;
    }>;
    payloadEncoding?: string;
    payloadType?: string;
    payload?: Uint8Array;
    LogIDNew?: string;
};
export declare function encodeFeishuFrame(frame: FeishuFrame): Uint8Array;
export declare function decodeFeishuFrame(bytes: Uint8Array): FeishuFrame;
export declare function feishuHeader(frame: FeishuFrame, key: string): string | undefined;
