import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { adminAuthError, createServerClose, hasAdminToken, InvalidJsonBodyError, isJsonObject, isLoopbackHost, jsonResponse, parseUnknownRequestBody, queryRecord, readBody, readInteger, readTrimmedString, RequestBodyTooLargeError, startHttpJsonServer, } from "./http.js";
import { SLACK_CHANNEL_ID_RULE, SLACK_SEND_TARGET_ID_RULE, SLACK_TS_RULE, SLACK_USER_ID_RULE, } from "../providers/slack-ids.js";
import { createServerRecorder } from "./recorder.js";
import { postWebhookRequestWithResponse, validateWebhookTarget, } from "./webhook-target.js";
const SLACK_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const SLACK_EVENT_MAX_RETRIES = 3;
const SLACK_EVENT_MAX_REDIRECTS = 2;
const SLACK_EVENT_RETRY_DELAYS_MS = [0, 60_000, 5 * 60_000];
class SlackEventHttpError extends Error {
    status;
    constructor(status) {
        super(`Slack Events API delivery failed with HTTP ${status}.`);
        this.status = status;
        this.name = "SlackEventHttpError";
    }
}
class SlackEventTargetError extends Error {
    retryReason;
    constructor(retryReason, targetError) {
        super(`Slack Events API target rejected: ${targetError}`);
        this.retryReason = retryReason;
        this.name = "SlackEventTargetError";
    }
}
function slackOk(result = {}) {
    return jsonResponse({ ok: true, ...result });
}
function slackError(error, status = 200) {
    return jsonResponse({ error, ok: false }, status);
}
function slackRateLimited(retryAfterSeconds = 1) {
    return new Response(JSON.stringify({ error: "ratelimited", ok: false }), {
        headers: {
            "content-type": "application/json",
            "retry-after": String(retryAfterSeconds),
        },
        status: 429,
    });
}
function resolveChatPostMessageRateLimit(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!Number.isSafeInteger(value.remaining) || value.remaining < 0) {
        throw new Error("chatPostMessageRateLimit.remaining must be a non-negative safe integer.");
    }
    if (!Number.isSafeInteger(value.retryAfterSeconds) || value.retryAfterSeconds < 1) {
        throw new Error("chatPostMessageRateLimit.retryAfterSeconds must be a positive safe integer.");
    }
    return { ...value };
}
function requireSlackToken(request, body, state) {
    const authorization = request.headers.authorization;
    let tokenFromHeader;
    if (typeof authorization === "string") {
        const trimmed = authorization.trim();
        if (trimmed.slice(0, 6).toLowerCase() === "bearer" && /\s/u.test(trimmed[6] ?? "")) {
            let tokenStart = 7;
            while (tokenStart < trimmed.length && /\s/u.test(trimmed[tokenStart])) {
                tokenStart += 1;
            }
            tokenFromHeader = trimmed.slice(tokenStart).trim() || undefined;
        }
    }
    const token = tokenFromHeader ?? readTrimmedString(body.token);
    if (!token) {
        return slackError("not_authed");
    }
    if (token !== state.botToken) {
        return slackError("invalid_auth");
    }
    return undefined;
}
function requireSlackChannelId(value) {
    const stringValue = readTrimmedString(value);
    if (!stringValue || !SLACK_CHANNEL_ID_RULE.pattern.test(stringValue)) {
        return slackError("channel_not_found");
    }
    return stringValue;
}
function requireSlackSendTargetId(value) {
    const stringValue = readTrimmedString(value);
    if (!stringValue || !SLACK_SEND_TARGET_ID_RULE.pattern.test(stringValue)) {
        return slackError("channel_not_found");
    }
    return stringValue;
}
function requireSlackUserId(value) {
    const stringValue = readTrimmedString(value);
    if (!stringValue || !SLACK_USER_ID_RULE.pattern.test(stringValue)) {
        return slackError("invalid_users");
    }
    return stringValue;
}
function requireSlackThreadTs(value) {
    const stringValue = readTrimmedString(value);
    if (!stringValue) {
        return undefined;
    }
    if (!SLACK_TS_RULE.pattern.test(stringValue)) {
        return slackError("invalid_ts");
    }
    return stringValue;
}
function readBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    const stringValue = readTrimmedString(value)?.toLowerCase();
    if (stringValue === "true" || stringValue === "1") {
        return true;
    }
    if (stringValue === "false" || stringValue === "0") {
        return false;
    }
    return undefined;
}
function readSlackText(value) {
    return typeof value === "string" ? value : undefined;
}
function readStructuredValue(value) {
    if (typeof value !== "string") {
        return value;
    }
    const stringValue = value.trim();
    if (!stringValue) {
        return undefined;
    }
    try {
        return JSON.parse(stringValue);
    }
    catch {
        return value;
    }
}
function readStructuredArray(value, error) {
    if (value === undefined) {
        return undefined;
    }
    const parsed = readStructuredValue(value);
    return Array.isArray(parsed) ? parsed : slackError(error);
}
function readSlackMetadata(value) {
    if (value === undefined) {
        return undefined;
    }
    let parsed = value;
    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        }
        catch {
            return slackError("invalid_metadata_format");
        }
    }
    if (!isJsonObject(parsed)) {
        return slackError("invalid_metadata_format");
    }
    if (!readTrimmedString(parsed.event_type) || !isJsonObject(parsed.event_payload)) {
        return slackError("invalid_metadata_schema");
    }
    return parsed;
}
function hasStructuredMessageContent(value) {
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    return Boolean(value && typeof value === "object");
}
function messagesForChannel(state, channel) {
    return state.messagesByChannel.get(channel) ?? [];
}
function hasThreadParent(state, params) {
    return messagesForChannel(state, params.channel).some((message) => message.ts === params.threadTs && message.thread_ts === undefined);
}
function resolveThreadTs(state, params) {
    const message = messagesForChannel(state, params.channel).find((candidate) => candidate.ts === params.ts);
    return message?.thread_ts ?? message?.ts;
}
function nextSlackTs(state) {
    const index = state.nextTsIndex++;
    return `${1_700_000_000 + Math.floor(index / 1_000_000)}.${String(index % 1_000_000).padStart(6, "0")}`;
}
function randomDecimalDigits(length) {
    return Array.from({ length }, () => randomInt(10)).join("");
}
function nextDmChannelId(state) {
    for (;;) {
        const index = state.nextDmIndex++;
        const channelId = `D${String(index).padStart(9, "0")}`;
        if (!state.messagesByChannel.has(channelId) &&
            ![...state.userDmChannels.values()].includes(channelId)) {
            return channelId;
        }
    }
}
function nextMpimChannelId(state) {
    for (;;) {
        const index = state.nextMpimIndex++;
        const channelId = `G${String(index).padStart(9, "0")}`;
        if (!state.messagesByChannel.has(channelId) &&
            ![...state.userMpimChannels.values()].some((channel) => channel.id === channelId)) {
            return channelId;
        }
    }
}
function dmChannelForUser(state, userId) {
    const existing = state.userDmChannels.get(userId);
    if (existing) {
        return existing;
    }
    const channelId = nextDmChannelId(state);
    state.userDmChannels.set(userId, channelId);
    return channelId;
}
function rememberDmChannel(state, userId, channelId) {
    if (!channelId.startsWith("D")) {
        return;
    }
    const mappedUser = [...state.userDmChannels].find(([, value]) => value === channelId)?.[0];
    if (mappedUser && mappedUser !== userId) {
        return;
    }
    state.userDmChannels.set(userId, channelId);
}
function mpimChannelForUsers(state, users) {
    const key = [...users].sort().join(",");
    const existing = state.userMpimChannels.get(key);
    if (existing) {
        return existing;
    }
    const channel = { id: nextMpimChannelId(state), users: [...users] };
    state.userMpimChannels.set(key, channel);
    return channel;
}
function requireSlackUsers(value, botUserId) {
    const rawUsers = readTrimmedString(value);
    if (!rawUsers) {
        return slackError("users_list_not_supplied");
    }
    const users = rawUsers.split(",").map((user) => user.trim());
    if (users.length > 8) {
        return slackError("too_many_users");
    }
    if (users.some((user) => !SLACK_USER_ID_RULE.pattern.test(user))) {
        return slackError("user_not_found");
    }
    if (new Set(users).size !== users.length) {
        return slackError("invalid_user_combination");
    }
    if (users.includes(botUserId)) {
        return slackError("invalid_user_combination");
    }
    return users;
}
function requireSlackLimit(value) {
    const limit = value === undefined ? 100 : readInteger(value);
    if (limit === undefined || limit < 1 || limit > 1_000) {
        return slackError("invalid_limit");
    }
    return limit;
}
function decodeSlackCursor(value, kind) {
    if (value === undefined || value === "") {
        return undefined;
    }
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value)) {
        return slackError("invalid_cursor");
    }
    const cursor = value;
    try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const prefix = `${kind}:`;
        if (!decoded.startsWith(prefix)) {
            return slackError("invalid_cursor");
        }
        const boundary = decoded.slice(prefix.length);
        const validBoundary = kind === "list"
            ? SLACK_CHANNEL_ID_RULE.pattern.test(boundary)
            : SLACK_TS_RULE.pattern.test(boundary);
        return validBoundary && encodeSlackCursor(kind, boundary) === cursor
            ? boundary
            : slackError("invalid_cursor");
    }
    catch {
        return slackError("invalid_cursor");
    }
}
function encodeSlackCursor(kind, boundary) {
    return Buffer.from(`${kind}:${boundary}`, "utf8").toString("base64url");
}
function appendMessage(state, message) {
    const messages = state.messagesByChannel.get(message.channel) ?? [];
    messages.push(message);
    state.messagesByChannel.set(message.channel, messages);
    return message;
}
function slackConversation(state, channelId) {
    const dmUser = [...state.userDmChannels].find(([, value]) => value === channelId)?.[0];
    const mpim = [...state.userMpimChannels.values()].find((candidate) => candidate.id === channelId);
    const hasMessages = state.messagesByChannel.has(channelId);
    if (!dmUser && !mpim && !hasMessages) {
        return undefined;
    }
    if (dmUser) {
        return {
            id: channelId,
            is_channel: false,
            is_group: false,
            is_im: true,
            is_mpim: false,
            user: dmUser,
        };
    }
    if (mpim) {
        return {
            id: channelId,
            is_channel: false,
            is_group: false,
            is_im: false,
            is_mpim: true,
            is_private: true,
            members: [state.botUserId, ...mpim.users],
            name: "crabline",
        };
    }
    return {
        id: channelId,
        is_channel: channelId.startsWith("C"),
        is_group: channelId.startsWith("G"),
        is_im: channelId.startsWith("D"),
        is_mpim: false,
        name: "crabline",
    };
}
function slackConversations(state) {
    const ids = new Set([
        ...state.messagesByChannel.keys(),
        ...state.userDmChannels.values(),
        ...[...state.userMpimChannels.values()].map((channel) => channel.id),
    ]);
    return [...ids]
        .sort()
        .map((channelId) => slackConversation(state, channelId))
        .filter((channel) => channel !== undefined);
}
function requireSlackConversationTypes(value) {
    const types = new Set((readTrimmedString(value) ?? "public_channel")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean));
    const supported = new Set(["im", "mpim", "private_channel", "public_channel"]);
    return [...types].every((type) => supported.has(type)) ? types : slackError("invalid_types");
}
function slackConversationType(conversation) {
    if (conversation.is_im === true) {
        return "im";
    }
    if (conversation.is_mpim === true) {
        return "mpim";
    }
    return conversation.is_group === true ? "private_channel" : "public_channel";
}
async function appendEvent(state, event, committed = false) {
    await (committed ? state.recorder.recordCommitted(event) : state.recorder.record(event));
}
function redactSlackAuthFields(value) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
        key,
        key.toLowerCase() === "token" ? "[redacted]" : entry,
    ]));
}
function redactSlackAuthQuery(value) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
        key,
        key.toLowerCase() === "token" ? "[redacted]" : entry,
    ]));
}
function createSlackMessage(state, params) {
    const ts = params.ts ?? nextSlackTs(state);
    return {
        ...(params.attachments ? { attachments: params.attachments } : {}),
        ...(params.blocks ? { blocks: params.blocks } : {}),
        ...(params.bot ? { bot_id: state.botId } : {}),
        channel: params.channel,
        ...(params.metadata ? { metadata: params.metadata } : {}),
        ...(params.replyBroadcast === undefined ? {} : { reply_broadcast: params.replyBroadcast }),
        text: params.text,
        ...(params.threadTs ? { thread_ts: params.threadTs } : {}),
        ts,
        type: "message",
        ...(params.unfurlLinks === undefined ? {} : { unfurl_links: params.unfurlLinks }),
        ...(params.unfurlMedia === undefined ? {} : { unfurl_media: params.unfurlMedia }),
        user: params.user ?? (params.bot ? state.botUserId : "UCRABUSER"),
    };
}
function asSlackEventCallback(state, message) {
    return {
        api_app_id: "ACRABLINE",
        authorizations: [
            {
                enterprise_id: null,
                is_bot: true,
                is_enterprise_install: false,
                team_id: "TCRABLINE",
                user_id: state.botUserId,
            },
        ],
        event: message,
        event_id: `Ev${message.ts.replace(".", "")}`,
        event_time: Number(message.ts.slice(0, 10)),
        team_id: "TCRABLINE",
        token: "crabline-event-token",
        type: "event_callback",
    };
}
function slackRequestSignature(signingSecret, timestamp, body) {
    const digest = createHmac("sha256", signingSecret)
        .update(`v0:${timestamp}:${body}`)
        .digest("hex");
    return `v0=${digest}`;
}
function authenticateSlackEventsRequest(request, state, rawBody) {
    const timestampHeader = request.headers["x-slack-request-timestamp"];
    const signatureHeader = request.headers["x-slack-signature"];
    const timestamp = Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader;
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const timestampSeconds = timestamp ? Number(timestamp) : Number.NaN;
    if (!timestamp ||
        !signature ||
        !Number.isSafeInteger(timestampSeconds) ||
        Math.abs(Date.now() / 1000 - timestampSeconds) > SLACK_SIGNATURE_TOLERANCE_SECONDS) {
        return new Response("unauthorized", { status: 401 });
    }
    const expected = Buffer.from(slackRequestSignature(state.signingSecret, timestamp, rawBody));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        return new Response("unauthorized", { status: 401 });
    }
    return undefined;
}
function errorChain(error) {
    const chain = [];
    let current = error;
    while (current && typeof current === "object" && chain.length < 4) {
        const entry = current;
        chain.push(entry);
        current = entry.cause;
    }
    return chain;
}
/** @internal */
export function classifySlackRetryReason(error) {
    if (error instanceof SlackEventHttpError) {
        return "http_error";
    }
    if (error instanceof SlackEventTargetError) {
        return error.retryReason;
    }
    const chain = errorChain(error);
    const names = chain.map((entry) => String(entry.name ?? ""));
    const codes = chain.map((entry) => String(entry.code ?? "").toUpperCase());
    const messages = chain.map((entry) => String(entry.message ?? "").toLowerCase());
    if (codes.includes("UND_ERR_REDIRECT") ||
        messages.some((message) => message.includes("redirect count exceeded"))) {
        return "too_many_redirects";
    }
    if (names.some((name) => name === "AbortError" || name === "TimeoutError") ||
        codes.some((code) => ["ETIMEDOUT", "UND_ERR_BODY_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT"].includes(code))) {
        return "http_timeout";
    }
    if (codes.some((code) => code.includes("CERT") ||
        code.includes("SSL") ||
        code.includes("TLS") ||
        code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE")) {
        return "ssl_error";
    }
    if (codes.some((code) => [
        "EAI_AGAIN",
        "ECONNREFUSED",
        "ECONNRESET",
        "EHOSTUNREACH",
        "ENETUNREACH",
        "ENOTFOUND",
        "UND_ERR_CONNECT_TIMEOUT",
        "UND_ERR_SOCKET",
    ].includes(code))) {
        return "connection_failed";
    }
    return "unknown_error";
}
function slackResponseHeader(response, name) {
    const value = response.headers[name];
    return Array.isArray(value) ? value[0] : value;
}
function slackTargetRetryReason(error) {
    return error === "https-required" ? "ssl_error" : "connection_failed";
}
/** @internal */
export async function postSlackEventToAddresses(params) {
    const addresses = params.addresses && params.addresses.length > 0 ? [...params.addresses] : [undefined];
    const request = params.request ?? postWebhookRequestWithResponse;
    let lastError;
    for (const [index, address] of addresses.entries()) {
        const remainingMs = params.timeoutAt - Date.now();
        if (remainingMs <= 0) {
            throw new DOMException("Slack Events API delivery timed out", "TimeoutError");
        }
        const attemptsRemaining = addresses.length - index;
        try {
            return await request({
                address,
                body: params.body,
                headerEntries: params.headerEntries,
                signal: params.signal,
                timeoutMs: Math.max(1, Math.floor(remainingMs / attemptsRemaining)),
                url: params.url,
            });
        }
        catch (error) {
            lastError = error;
            if (params.signal.aborted) {
                throw error;
            }
        }
    }
    throw lastError;
}
async function postSlackEventRequest(params) {
    const target = await validateWebhookTarget({
        allowLoopbackHttp: params.state.allowLoopbackHttpEvents,
        restrictPrivateAddresses: params.state.restrictEventTargets,
        signal: params.signal,
        url: params.url,
    });
    if ("error" in target) {
        throw new SlackEventTargetError(slackTargetRetryReason(target.error), target.error);
    }
    return await postSlackEventToAddresses({
        addresses: target.addresses,
        body: params.body,
        headerEntries: params.headerEntries,
        signal: params.signal,
        timeoutAt: params.timeoutAt,
        url: params.url,
    });
}
async function waitForSlackRetry(delayMs, signal) {
    if (signal.aborted) {
        return false;
    }
    return await new Promise((resolve) => {
        let settled = false;
        const finish = (completed) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            signal.removeEventListener("abort", onAbort);
            resolve(completed);
        };
        const onAbort = () => finish(false);
        const timer = setTimeout(() => finish(true), delayMs);
        timer.unref();
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted) {
            onAbort();
        }
    });
}
async function deliverSlackEvent(state, event, lifecycleSignal) {
    if (!state.eventsRequestUrl) {
        return undefined;
    }
    const body = JSON.stringify(event);
    let retryReason;
    for (let attempt = 0; attempt <= SLACK_EVENT_MAX_RETRIES; attempt += 1) {
        if (lifecycleSignal.aborted) {
            return;
        }
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const headerEntries = [
                ["content-type", "application/json"],
                ...(attempt > 0
                    ? [
                        ["x-slack-retry-num", String(attempt)],
                        ["x-slack-retry-reason", retryReason ?? "unknown_error"],
                    ]
                    : []),
                ["x-slack-request-timestamp", timestamp],
                ["x-slack-signature", slackRequestSignature(state.signingSecret, timestamp, body)],
            ];
            const signal = AbortSignal.any([lifecycleSignal, AbortSignal.timeout(3_000)]);
            const timeoutAt = Date.now() + 3_000;
            let requestUrl = new URL(state.eventsRequestUrl);
            let response;
            for (let redirectCount = 0;; redirectCount += 1) {
                response = await postSlackEventRequest({
                    body,
                    headerEntries,
                    signal,
                    state,
                    timeoutAt,
                    url: requestUrl,
                });
                const noRetry = slackResponseHeader(response, "x-slack-no-retry") === "1";
                if (noRetry) {
                    return;
                }
                const location = slackResponseHeader(response, "location");
                if (![301, 302].includes(response.status) || !location) {
                    break;
                }
                if (redirectCount >= SLACK_EVENT_MAX_REDIRECTS) {
                    response = undefined;
                    retryReason = "too_many_redirects";
                    break;
                }
                requestUrl = new URL(location, requestUrl);
            }
            if (response) {
                if (response.status >= 200 && response.status < 300) {
                    return;
                }
                throw new SlackEventHttpError(response.status);
            }
        }
        catch (error) {
            if (lifecycleSignal.aborted) {
                return;
            }
            retryReason = classifySlackRetryReason(error);
        }
        const retryDelay = SLACK_EVENT_RETRY_DELAYS_MS[attempt];
        if (retryDelay !== undefined && !(await waitForSlackRetry(retryDelay, lifecycleSignal))) {
            return;
        }
    }
}
function scheduleSlackEventDelivery(state, event) {
    if (!state.eventsRequestUrl || state.closing) {
        return;
    }
    const delivery = deliverSlackEvent(state, event, state.deliveryAbortController.signal).finally(() => {
        state.activeEventDeliveries.delete(delivery);
    });
    state.activeEventDeliveries.add(delivery);
}
async function handleSlackApi(params) {
    switch (params.method) {
        case "auth.test":
            return slackOk({
                bot_id: params.state.botId,
                response_metadata: {
                    scopes: [
                        "chat:write",
                        "channels:history",
                        "groups:history",
                        "im:history",
                        "mpim:history",
                    ],
                },
                team: "Crabline",
                team_id: "TCRABLINE",
                url: "https://crabline.slack.test/",
                user: "crabline",
                user_id: params.state.botUserId,
            });
        case "chat.postMessage": {
            const rateLimit = params.state.chatPostMessageRateLimit;
            if (rateLimit && rateLimit.remaining <= 0) {
                return slackRateLimited(rateLimit.retryAfterSeconds);
            }
            if (rateLimit) {
                rateLimit.remaining -= 1;
            }
            const requestedChannel = requireSlackSendTargetId(params.body.channel);
            if (requestedChannel instanceof Response) {
                return requestedChannel;
            }
            const channel = SLACK_USER_ID_RULE.pattern.test(requestedChannel)
                ? dmChannelForUser(params.state, requestedChannel)
                : requestedChannel;
            const text = readSlackText(params.body.text) ?? "";
            const attachments = readStructuredArray(params.body.attachments, "invalid_attachments");
            if (attachments instanceof Response) {
                return attachments;
            }
            const blocks = readStructuredArray(params.body.blocks, "invalid_blocks");
            if (blocks instanceof Response) {
                return blocks;
            }
            const metadata = readSlackMetadata(params.body.metadata);
            if (metadata instanceof Response) {
                return metadata;
            }
            if (!text &&
                !hasStructuredMessageContent(blocks) &&
                !hasStructuredMessageContent(attachments)) {
                return slackError("no_text");
            }
            if (text.length > 40_000) {
                return slackError("msg_too_long");
            }
            const threadTs = requireSlackThreadTs(params.body.thread_ts);
            if (threadTs instanceof Response) {
                return threadTs;
            }
            if (threadTs && !hasThreadParent(params.state, { channel, threadTs })) {
                return slackError("thread_not_found");
            }
            const message = appendMessage(params.state, createSlackMessage(params.state, {
                attachments,
                blocks,
                bot: true,
                channel,
                metadata,
                replyBroadcast: readBoolean(params.body.reply_broadcast),
                text,
                threadTs,
                unfurlLinks: readBoolean(params.body.unfurl_links),
                unfurlMedia: readBoolean(params.body.unfurl_media),
            }));
            return slackOk({ channel, message, ts: message.ts });
        }
        case "conversations.open": {
            const users = requireSlackUsers(params.body.users, params.state.botUserId);
            if (users instanceof Response) {
                return users;
            }
            if (users.length > 1) {
                const channel = mpimChannelForUsers(params.state, users);
                return slackOk({
                    channel: {
                        id: channel.id,
                        is_group: false,
                        is_mpim: true,
                        is_private: true,
                        members: [params.state.botUserId, ...channel.users],
                    },
                });
            }
            const user = users[0];
            return slackOk({
                channel: {
                    id: dmChannelForUser(params.state, user),
                    is_im: true,
                    user,
                },
            });
        }
        case "conversations.info": {
            const channel = requireSlackChannelId(params.body.channel);
            if (channel instanceof Response) {
                return channel;
            }
            const conversation = slackConversation(params.state, channel);
            return conversation ? slackOk({ channel: conversation }) : slackError("channel_not_found");
        }
        case "conversations.list": {
            const types = requireSlackConversationTypes(params.body.types);
            if (types instanceof Response) {
                return types;
            }
            const limit = requireSlackLimit(params.body.limit);
            if (limit instanceof Response) {
                return limit;
            }
            const boundary = decodeSlackCursor(params.body.cursor, "list");
            if (boundary instanceof Response) {
                return boundary;
            }
            const remaining = slackConversations(params.state).filter((conversation) => {
                const channelId = readTrimmedString(conversation.id);
                return channelId && (boundary === undefined || channelId > boundary);
            });
            const virtualPage = remaining.slice(0, limit);
            const channels = virtualPage.filter((conversation) => types.has(slackConversationType(conversation)));
            const hasMore = virtualPage.length < remaining.length;
            const nextBoundary = readTrimmedString(virtualPage.at(-1)?.id);
            return slackOk({
                channels,
                response_metadata: {
                    next_cursor: hasMore && nextBoundary ? encodeSlackCursor("list", nextBoundary) : "",
                },
            });
        }
        case "conversations.history": {
            const channel = requireSlackChannelId(params.body.channel);
            if (channel instanceof Response) {
                return channel;
            }
            if (!slackConversation(params.state, channel)) {
                return slackError("channel_not_found");
            }
            const oldest = requireSlackThreadTs(params.body.oldest);
            if (oldest instanceof Response) {
                return oldest;
            }
            const latest = requireSlackThreadTs(params.body.latest);
            if (latest instanceof Response) {
                return latest;
            }
            const limit = requireSlackLimit(params.body.limit);
            if (limit instanceof Response) {
                return limit;
            }
            const boundary = decodeSlackCursor(params.body.cursor, "history");
            if (boundary instanceof Response) {
                return boundary;
            }
            const messages = messagesForChannel(params.state, channel).filter((message) => {
                if (message.thread_ts !== undefined && message.reply_broadcast !== true) {
                    return false;
                }
                if (oldest && message.ts <= oldest) {
                    return false;
                }
                if (latest && message.ts >= latest) {
                    return false;
                }
                return true;
            });
            const ordered = [...messages]
                .reverse()
                .filter((message) => boundary === undefined || message.ts < boundary);
            const page = ordered.slice(0, limit);
            const hasMore = page.length < ordered.length;
            const nextBoundary = page.at(-1)?.ts;
            return slackOk({
                has_more: hasMore,
                messages: page,
                response_metadata: {
                    next_cursor: hasMore && nextBoundary ? encodeSlackCursor("history", nextBoundary) : "",
                },
            });
        }
        case "conversations.replies": {
            const channel = requireSlackChannelId(params.body.channel);
            if (channel instanceof Response) {
                return channel;
            }
            if (!slackConversation(params.state, channel)) {
                return slackError("channel_not_found");
            }
            const ts = requireSlackThreadTs(params.body.ts);
            if (ts instanceof Response) {
                return ts;
            }
            if (!ts) {
                return slackError("message_not_found");
            }
            const threadTs = resolveThreadTs(params.state, { channel, ts });
            if (!threadTs) {
                return slackError("thread_not_found");
            }
            const limit = requireSlackLimit(params.body.limit);
            if (limit instanceof Response) {
                return limit;
            }
            const boundary = decodeSlackCursor(params.body.cursor, "replies");
            if (boundary instanceof Response) {
                return boundary;
            }
            const messages = messagesForChannel(params.state, channel).filter((message) => (message.ts === threadTs || message.thread_ts === threadTs) &&
                (boundary === undefined || message.ts > boundary));
            const page = messages.slice(0, limit);
            const hasMore = page.length < messages.length;
            const nextBoundary = page.at(-1)?.ts;
            return slackOk({
                has_more: hasMore,
                messages: page,
                response_metadata: {
                    next_cursor: hasMore && nextBoundary ? encodeSlackCursor("replies", nextBoundary) : "",
                },
            });
        }
        default:
            return slackError("unknown_method", 404);
    }
}
async function handleAdminInbound(params) {
    const channel = requireSlackChannelId(params.body.channel);
    if (channel instanceof Response) {
        return channel;
    }
    if (params.body.text !== undefined && typeof params.body.text !== "string") {
        return slackError("invalid_text", 400);
    }
    const text = readSlackText(params.body.text) ?? "";
    const attachments = readStructuredArray(params.body.attachments, "invalid_attachments");
    if (attachments instanceof Response) {
        return attachments;
    }
    const blocks = readStructuredArray(params.body.blocks, "invalid_blocks");
    if (blocks instanceof Response) {
        return blocks;
    }
    const user = requireSlackUserId(params.body.user ?? "UCRABUSER");
    if (user instanceof Response) {
        return user;
    }
    rememberDmChannel(params.state, user, channel);
    const threadTs = requireSlackThreadTs(params.body.threadTs ?? params.body.thread_ts);
    if (threadTs instanceof Response) {
        return threadTs;
    }
    if (threadTs && !hasThreadParent(params.state, { channel, threadTs })) {
        return slackError("thread_not_found");
    }
    const ts = requireSlackThreadTs(params.body.ts);
    if (ts instanceof Response) {
        return ts;
    }
    const message = appendMessage(params.state, createSlackMessage(params.state, {
        attachments,
        blocks,
        channel,
        text,
        threadTs,
        ts,
        user,
    }));
    const event = asSlackEventCallback(params.state, message);
    scheduleSlackEventDelivery(params.state, event);
    return slackOk({ event, message });
}
async function handleRequest(params) {
    const url = new URL(params.request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/crabline/slack/inbound") {
        if (params.request.method !== "POST") {
            return new Response("not found", { status: 404 });
        }
        if (!hasAdminToken(params.request, params.state.adminToken)) {
            params.request.resume();
            return adminAuthError();
        }
        const body = await parseUnknownRequestBody(params.request);
        if (!isJsonObject(body)) {
            return slackError("invalid_json", 400);
        }
        await appendEvent(params.state, {
            at: new Date().toISOString(),
            body,
            method: params.request.method,
            path: url.pathname,
            query: queryRecord(url),
            type: "admin",
        });
        return await handleAdminInbound({ body, state: params.state });
    }
    const query = queryRecord(url);
    if (url.pathname === "/slack/events") {
        if (params.request.method !== "POST") {
            params.request.resume();
            return new Response("method not allowed", {
                headers: { allow: "POST" },
                status: 405,
            });
        }
        if (!params.request.headers["x-slack-request-timestamp"] ||
            !params.request.headers["x-slack-signature"]) {
            params.request.resume();
            return new Response("unauthorized", { status: 401 });
        }
        const rawBody = (await readBody(params.request)).toString("utf8");
        const authError = authenticateSlackEventsRequest(params.request, params.state, rawBody);
        if (authError) {
            return authError;
        }
        let body;
        try {
            body = rawBody ? JSON.parse(rawBody) : {};
        }
        catch (error) {
            throw new InvalidJsonBodyError(error);
        }
        if (!isJsonObject(body)) {
            return slackError("invalid_json", 400);
        }
        if (body.type === "url_verification") {
            return jsonResponse({ challenge: readTrimmedString(body.challenge) ?? "" });
        }
        if (!readTrimmedString(body.type)) {
            return slackError("invalid_payload", 400);
        }
        return new Response(null, { status: 200 });
    }
    const methodMatch = /^\/api\/([a-z]+(?:\.[a-zA-Z]+)*)$/u.exec(url.pathname);
    if (!methodMatch?.[1]) {
        return new Response("not found", { status: 404 });
    }
    const requestMethod = params.request.method ?? "GET";
    if (requestMethod !== "GET" && requestMethod !== "POST") {
        params.request.resume();
        return new Response("method not allowed", {
            headers: { allow: "GET, POST" },
            status: 405,
        });
    }
    if (params.request.headers.authorization) {
        const headerAuthError = requireSlackToken(params.request, {}, params.state);
        if (headerAuthError) {
            params.request.resume();
            return headerAuthError;
        }
    }
    const body = requestMethod === "GET" ? query : await parseUnknownRequestBody(params.request);
    if (!isJsonObject(body)) {
        return slackError("json_not_object", 400);
    }
    const authError = requireSlackToken(params.request, body, params.state);
    if (authError) {
        return authError;
    }
    const event = {
        at: new Date().toISOString(),
        body: redactSlackAuthFields(body),
        method: params.request.method ?? "GET",
        path: url.pathname,
        query: redactSlackAuthQuery(query),
        type: "api",
    };
    const response = await handleSlackApi({
        body,
        method: methodMatch[1],
        state: params.state,
    });
    const mutation = ["chat.postMessage", "conversations.open"].includes(methodMatch[1]);
    const recordsAcceptance = mutation || methodMatch[1] === "auth.test";
    const payload = recordsAcceptance
        ? (await response
            .clone()
            .json()
            .catch(() => undefined))
        : undefined;
    const committed = isJsonObject(payload) && payload.ok === true;
    if (methodMatch[1] === "auth.test" || methodMatch[1] === "chat.postMessage") {
        event.accepted = committed;
    }
    await appendEvent(params.state, event, mutation && committed);
    return response;
}
export async function startSlackServer(params = {}) {
    const host = params.host ?? "127.0.0.1";
    const externallyBound = !isLoopbackHost(host);
    const recorderPath = params.recorderPath ?? path.resolve(".crabline", "servers", "slack.jsonl");
    const state = {
        activeEventDeliveries: new Set(),
        adminToken: params.adminToken ?? randomBytes(24).toString("base64url"),
        allowLoopbackHttpEvents: isLoopbackHost(host),
        botId: params.botId ?? "BCRABLINE",
        botToken: params.botToken ?? "xoxb-crabline-slack-token",
        botUserId: params.botUserId ?? "UCRABBOT",
        chatPostMessageRateLimit: resolveChatPostMessageRateLimit(params.chatPostMessageRateLimit),
        closing: false,
        deliveryAbortController: new AbortController(),
        eventsRequestUrl: params.eventsRequestUrl,
        nextDmIndex: 1,
        nextMpimIndex: 1,
        nextTsIndex: 100,
        recorder: createServerRecorder({ recorderPath, onEvent: params.onEvent }),
        recorderPath,
        restrictEventTargets: true,
        signingSecret: params.signingSecret ?? "crabline-slack-signing-secret",
        userDmChannels: new Map(),
        userMpimChannels: new Map(),
        messagesByChannel: new Map(),
    };
    if (externallyBound && !params.botToken) {
        const generatedBotValue = `xoxb-${randomDecimalDigits(12)}-${randomDecimalDigits(12)}-${randomBytes(18).toString("base64url")}`;
        state.botToken = generatedBotValue;
    }
    if (externallyBound && !params.signingSecret) {
        const generatedSigningValue = randomBytes(16).toString("hex");
        state.signingSecret = generatedSigningValue;
    }
    const httpServer = await startHttpJsonServer({
        handle: (request) => handleRequest({ request, state }),
        handleError: (error) => {
            if (error instanceof InvalidJsonBodyError) {
                return slackError("invalid_json", 400);
            }
            if (error instanceof RequestBodyTooLargeError) {
                return slackError("request_too_large", 413);
            }
            return undefined;
        },
        host,
        port: params.port ?? 0,
        serverName: "Slack",
    });
    const baseUrl = httpServer.baseUrl;
    const apiRoot = `${baseUrl}/api/`;
    return {
        close: createServerClose(state.recorder, async () => {
            state.closing = true;
            state.deliveryAbortController.abort();
            await Promise.allSettled(state.activeEventDeliveries);
            await httpServer.close();
        }),
        manifest: {
            adminToken: state.adminToken,
            baseUrl,
            botToken: state.botToken,
            endpoints: {
                adminInboundUrl: `${baseUrl}/crabline/slack/inbound`,
                apiRoot,
                eventsUrl: `${baseUrl}/slack/events`,
            },
            env: {
                SLACK_API_URL: apiRoot,
                SLACK_BOT_TOKEN: state.botToken,
                SLACK_SIGNING_SECRET: state.signingSecret,
            },
            provider: "slack",
            recorderPath: state.recorderPath,
            signingSecret: state.signingSecret,
            version: 1,
        },
    };
}
//# sourceMappingURL=slack.js.map