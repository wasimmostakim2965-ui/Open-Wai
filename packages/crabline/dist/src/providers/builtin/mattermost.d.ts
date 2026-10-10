import type { ProviderConfig } from "../../config/schema.js";
import { LocalMockProviderAdapter } from "../local-mock.js";
import type { ProviderAdapter } from "../types.js";
type MattermostEnvironment = Partial<Pick<NodeJS.ProcessEnv, "MATTERMOST_BASE_URL" | "MATTERMOST_BOT_TOKEN" | "MATTERMOST_TOKEN" | "MATTERMOST_URL">>;
export declare function resolveMattermostAdapterConfig(config: ProviderConfig, env?: MattermostEnvironment): {
    baseUrl: string;
    botToken: string;
    userName: string | undefined;
    webhookToken: string | undefined;
};
export declare class MattermostProviderAdapter extends LocalMockProviderAdapter implements ProviderAdapter {
    constructor(id: string, config: ProviderConfig, _userName: string, runtime?: unknown);
}
export declare function matchesMattermostThread(candidateThreadId: string, expectedThreadId: string | undefined, target: {
    channelId?: string | undefined;
}): boolean;
type NormalizedMattermostWebhookPayload = {
    author: "assistant" | "system" | "user";
    id?: string | undefined;
    raw: unknown;
    text: string;
    threadId: string;
};
export declare function normalizeMattermostWebhookPayload(payload: unknown): NormalizedMattermostWebhookPayload;
export {};
