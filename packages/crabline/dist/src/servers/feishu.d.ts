import { type ServerEventObserver } from "./recorder.js";
export type FeishuServerManifest = {
    provider: "feishu";
    version: 1;
    appId: string;
    appSecret: string;
    adminToken: string;
    botOpenId: string;
    baseUrl: string;
    recorderPath: string;
    endpoints: {
        apiRoot: string;
        adminInboundUrl: string;
        discoveryUrl: string;
    };
};
export type StartedFeishuServer = {
    manifest: FeishuServerManifest;
    close(): Promise<void>;
};
export type StartFeishuServerParams = {
    appId?: string | undefined;
    appSecret?: string | undefined;
    adminToken?: string | undefined;
    botOpenId?: string | undefined;
    host?: string | undefined;
    port?: number | undefined;
    tls?: {
        key: string | Buffer;
        cert: string | Buffer;
    } | undefined;
    recorderPath?: string | undefined;
    onEvent?: ServerEventObserver | undefined;
    maxMessages?: number | undefined;
    maxStateBytes?: number | undefined;
    maxPendingEvents?: number | undefined;
    maxEventBytes?: number | undefined;
    maxFragments?: number | undefined;
    maxSockets?: number | undefined;
    maxOutstandingAcks?: number | undefined;
    ackTimeoutMs?: number | undefined;
};
export declare function startFeishuServer(params?: StartFeishuServerParams): Promise<StartedFeishuServer>;
