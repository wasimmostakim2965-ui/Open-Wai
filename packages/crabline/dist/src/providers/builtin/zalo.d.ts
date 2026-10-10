import type { ProviderConfig } from "../../config/schema.js";
import { LocalMockProviderAdapter } from "../local-mock.js";
import type { ProviderAdapter } from "../types.js";
type ZaloEnvironment = Partial<Pick<NodeJS.ProcessEnv, "ZALO_BOT_TOKEN" | "ZALO_WEBHOOK_SECRET">>;
export declare function resolveZaloAdapterConfig(config: ProviderConfig, env?: ZaloEnvironment): {
    botToken: string;
    webhookSecret: string | undefined;
};
export declare class ZaloProviderAdapter extends LocalMockProviderAdapter implements ProviderAdapter {
    constructor(id: string, config: ProviderConfig, _userName: string, runtime?: unknown);
}
export declare function matchesZaloTarget(candidateThreadId: string, expectedThreadId: string | undefined): boolean;
export declare function normalizeZaloWebhookPayload(payload: unknown): {
    author?: "assistant" | "system" | "user" | undefined;
    authorIsBot?: boolean;
    id?: string | undefined;
    raw: {};
    text?: string | undefined;
};
export {};
