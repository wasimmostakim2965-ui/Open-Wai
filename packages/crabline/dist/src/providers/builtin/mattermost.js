import path from "node:path";
import { CrablineError } from "../../core/errors.js";
import { isLoopbackHost } from "../../servers/http.js";
import { LocalMockProviderAdapter, resolveGeneratedLocalMockRecorderPath } from "../local-mock.js";
import { appendRecordedInbound } from "../recorder.js";
import { getBuiltinTargetCodec, MATTERMOST_ID_RULE } from "../target-normalizers.js";
import { authorFromBotFlag, createSecretVerifier, genericMockPayloadWithNativeThread, isRecord, optionalRecord, optionalString, requireNativeInboundId, } from "./native-local-mock.js";
import { requireExternalWebhookAuthentication } from "./external-webhook-auth.js";
export function resolveMattermostAdapterConfig(config, env = process.env) {
    const baseUrl = config.mattermost?.baseUrl ??
        env.MATTERMOST_URL ??
        env.MATTERMOST_BASE_URL ??
        "http://127.0.0.1";
    let parsedBaseUrl;
    try {
        parsedBaseUrl = new URL(baseUrl);
    }
    catch (error) {
        throw new CrablineError("Mattermost base URL is invalid.", {
            cause: error,
            kind: "config",
        });
    }
    if (parsedBaseUrl.protocol !== "https:" &&
        !(parsedBaseUrl.protocol === "http:" && isLoopbackHost(parsedBaseUrl.hostname))) {
        throw new CrablineError("Mattermost bearer authentication requires HTTPS; plain HTTP is allowed only for loopback-local servers.", { kind: "config" });
    }
    const configuredWebhookToken = config.mattermost?.webhookToken;
    const webhookToken = configuredWebhookToken ?? env.MATTERMOST_TOKEN;
    if (webhookToken !== undefined && !webhookToken.trim()) {
        throw new CrablineError(configuredWebhookToken === undefined
            ? "MATTERMOST_TOKEN must not be empty or whitespace-only."
            : "Mattermost webhookToken must not be empty or whitespace-only.", { kind: "config" });
    }
    return {
        baseUrl,
        botToken: config.mattermost?.botToken ?? env.MATTERMOST_BOT_TOKEN ?? "local-mock-token",
        userName: config.mattermost?.userName,
        webhookToken,
    };
}
export class MattermostProviderAdapter extends LocalMockProviderAdapter {
    constructor(id, config, _userName, runtime) {
        const env = runtime?.env ?? process.env;
        const resolvedConfig = resolveMattermostAdapterConfig(config, env);
        const authenticateWebhook = resolvedConfig.webhookToken
            ? createSecretVerifier(resolvedConfig.webhookToken)
            : undefined;
        requireExternalWebhookAuthentication({
            authenticated: Boolean(authenticateWebhook),
            provider: "Mattermost",
            requirement: "webhookToken or MATTERMOST_TOKEN",
            webhook: config.mattermost?.webhook,
        });
        const recorderPath = config.mattermost?.recorder.path
            ? path.resolve(config.mattermost.recorder.path)
            : resolveGeneratedLocalMockRecorderPath(id);
        super({
            codec: getBuiltinTargetCodec("mattermost"),
            config,
            id,
            options: {
                ...(authenticateWebhook
                    ? {
                        authenticateWebhookRequest(request, rawBody) {
                            return authenticateWebhook(readMattermostWebhookToken(request, rawBody))
                                ? undefined
                                : new Response("unauthorized", { status: 401 });
                        },
                    }
                    : {}),
                defaultWebhook: { host: "127.0.0.1", path: "/mattermost/webhook", port: 8793 },
                endpointLabel: "webhook endpoint",
                matchesThread: matchesMattermostThread,
                handleWebhookPayload: async (payload, request) => {
                    const mediaType = request.headers
                        .get("content-type")
                        ?.split(";", 1)[0]
                        ?.trim()
                        .toLowerCase();
                    if (mediaType !== "application/x-www-form-urlencoded" || typeof payload !== "string") {
                        return undefined;
                    }
                    let normalized;
                    try {
                        normalized = normalizeMattermostWebhookPayload(Object.fromEntries(new URLSearchParams(payload).entries()));
                    }
                    catch (error) {
                        if (error instanceof CrablineError && error.kind === "inbound") {
                            return new Response(error.message, { status: 400 });
                        }
                        throw error;
                    }
                    const messageId = normalized.id ??
                        `mattermost-mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                    await appendRecordedInbound(recorderPath, {
                        author: normalized.author,
                        id: messageId,
                        provider: id,
                        raw: normalized.raw,
                        recordedDirection: "inbound",
                        sentAt: new Date().toISOString(),
                        text: normalized.text,
                        threadId: normalized.threadId,
                    });
                    return new Response(JSON.stringify({ id: messageId, ok: true }), {
                        headers: { "content-type": "application/json" },
                    });
                },
                normalizeWebhookPayload: normalizeMattermostWebhookPayload,
                platform: "mattermost",
                publicUrl: config.mattermost?.webhook.publicUrl,
                recorderPath,
                webhook: config.mattermost?.webhook,
                webhookMethods: ["POST"],
            },
        });
    }
}
function mattermostThreadKey(channelId, rootId) {
    return `${channelId}:thread:${rootId}`;
}
export function matchesMattermostThread(candidateThreadId, expectedThreadId, target) {
    if (!expectedThreadId) {
        return true;
    }
    if (target.channelId &&
        MATTERMOST_ID_RULE.pattern.test(expectedThreadId) &&
        expectedThreadId !== target.channelId) {
        return candidateThreadId === mattermostThreadKey(target.channelId, expectedThreadId);
    }
    return (candidateThreadId === expectedThreadId ||
        (MATTERMOST_ID_RULE.pattern.test(expectedThreadId) &&
            candidateThreadId.startsWith(`${expectedThreadId}:thread:`)));
}
function readMattermostWebhookToken(request, rawBody) {
    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType === "application/x-www-form-urlencoded") {
        return new URLSearchParams(rawBody).get("token");
    }
    if (mediaType !== "application/json") {
        return null;
    }
    try {
        const payload = JSON.parse(rawBody);
        return isRecord(payload) && typeof payload.token === "string" ? payload.token : null;
    }
    catch {
        return null;
    }
}
function withoutMattermostWebhookToken(payload) {
    const { token: _token, ...safePayload } = payload;
    return safePayload;
}
export function normalizeMattermostWebhookPayload(payload) {
    if (!isRecord(payload)) {
        throw new CrablineError("Mattermost webhook payload must be an object", { kind: "inbound" });
    }
    const safePayload = withoutMattermostWebhookToken(payload);
    const genericMessage = optionalRecord(safePayload, "message");
    if (genericMessage) {
        const normalized = genericMockPayloadWithNativeThread({
            channelRule: MATTERMOST_ID_RULE,
            payload: safePayload,
            threadRule: MATTERMOST_ID_RULE,
        });
        const channelId = optionalString(genericMessage, "channelId") ?? optionalString(safePayload, "channelId");
        const rootId = optionalString(genericMessage, "threadId") ?? optionalString(safePayload, "threadId");
        if (!channelId || !rootId || channelId === rootId) {
            // Without channelId, the generic threadId is the channel-level conversation.
            return normalized;
        }
        const scopedThreadId = mattermostThreadKey(requireNativeInboundId(channelId, MATTERMOST_ID_RULE, "Mattermost channelId"), requireNativeInboundId(rootId, MATTERMOST_ID_RULE, "Mattermost threadId"));
        return {
            ...normalized,
            ...("message" in normalized && isRecord(normalized.message)
                ? { message: { ...normalized.message, threadId: scopedThreadId } }
                : {}),
            threadId: scopedThreadId,
        };
    }
    const channelId = optionalString(safePayload, "channel_id");
    const postId = optionalString(safePayload, "post_id");
    const rootId = optionalString(safePayload, "root_id");
    const text = optionalString(safePayload, "text");
    if (!channelId || !text) {
        throw new CrablineError("Mattermost webhook payload requires channel_id and text", {
            kind: "inbound",
        });
    }
    return {
        author: authorFromBotFlag(false),
        ...(postId
            ? { id: requireNativeInboundId(postId, MATTERMOST_ID_RULE, "Mattermost post_id") }
            : {}),
        raw: safePayload,
        text,
        threadId: rootId
            ? mattermostThreadKey(requireNativeInboundId(channelId, MATTERMOST_ID_RULE, "Mattermost channel_id"), requireNativeInboundId(rootId, MATTERMOST_ID_RULE, "Mattermost root_id"))
            : requireNativeInboundId(channelId, MATTERMOST_ID_RULE, "Mattermost channel_id"),
    };
}
//# sourceMappingURL=mattermost.js.map