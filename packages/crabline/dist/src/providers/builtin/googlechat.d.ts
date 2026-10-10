import type { ProviderConfig } from "../../config/schema.js";
import { LocalMockProviderAdapter } from "../local-mock.js";
import type { ProviderAdapter } from "../types.js";
type GoogleChatAuthRuntime = {
    fetch?: typeof fetch | undefined;
    keyFetchTimeoutMs?: number | undefined;
    now?: (() => number) | undefined;
    unknownKeyCooldownMs?: number | undefined;
};
export declare function createGoogleChatWebhookAuthenticator(config: ProviderConfig, runtime?: GoogleChatAuthRuntime): ((request: Request, rawBody: string) => Promise<Response | undefined>) | undefined;
export declare function matchesGoogleChatThread(candidateThreadId: string, expectedThreadId: string | undefined, target?: {
    channelId?: string | undefined;
}): boolean;
export declare class GoogleChatProviderAdapter extends LocalMockProviderAdapter implements ProviderAdapter {
    constructor(id: string, config: ProviderConfig, _userName: string, runtime?: unknown);
}
export declare function normalizeGoogleChatWebhookPayload(payload: unknown): {
    author?: "assistant" | "system" | "user" | undefined;
    authorIsBot?: boolean;
    id?: string | undefined;
    raw: {};
    text?: string | undefined;
};
export declare function handleGoogleChatWebhookPayload(payload: unknown): Response | undefined;
export {};
