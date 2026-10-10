import path from "node:path";
import { CrablineError, ensureErrorMessage } from "../core/errors.js";
import { isJsonMediaType } from "../servers/http.js";
import { appendRecordedInbound, appendRecordedInboundBatch, cloneRecordedInboundCursor, createRecordedInboundCursor, waitForRecordedInbound, watchRecordedInbound, } from "./recorder.js";
import { startWebhookServer } from "./webhook-server.js";
export { createGenericLocalMockTargetCodec } from "./target-normalizers.js";
const MAX_WAIT_CURSORS = 64;
const DEFAULT_WEBHOOK_CLEANUP_GRACE_MS = 250;
function cursorHasAdvanced(candidate, current) {
    if (!current) {
        return true;
    }
    if (candidate.readState.generation !== current.readState.generation) {
        return candidate.readState.generation > current.readState.generation;
    }
    if (candidate.readState.offset !== current.readState.offset) {
        return candidate.readState.offset > current.readState.offset;
    }
    return candidate.buffered.length < current.buffered.length;
}
function pruneInactiveWaitCursors(cursors) {
    for (const [key, state] of cursors) {
        if (cursors.size <= MAX_WAIT_CURSORS) {
            return;
        }
        if (state.active === 0) {
            cursors.delete(key);
        }
    }
}
function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        let timer;
        const cleanup = () => signal?.removeEventListener("abort", abort);
        const abort = () => {
            if (timer) {
                clearTimeout(timer);
            }
            cleanup();
            reject(signal?.reason ?? new Error("Provider operation aborted."));
        };
        timer = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);
        if (signal?.aborted) {
            abort();
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
    });
}
function isAddressInChannel(threadId, channelId) {
    if (!channelId) {
        return true;
    }
    return threadId === channelId || threadId.startsWith(`${channelId}:`);
}
function createMessageId(platform) {
    return `${platform}-mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function unsafeGeneratedRecorderProviderId(providerId) {
    return (path.posix.parse(providerId).root !== "" ||
        path.win32.parse(providerId).root !== "" ||
        providerId.split(/[\\/]/u).includes(".."));
}
export function resolveGeneratedLocalMockRecorderPath(providerId, suffix = "") {
    const recorderDirectory = path.resolve(".crabline", "recorders");
    if (unsafeGeneratedRecorderProviderId(providerId)) {
        throw new CrablineError("Provider ID cannot contain absolute or parent-directory paths.", {
            kind: "config",
        });
    }
    const recorderPath = path.resolve(recorderDirectory, `${providerId}${suffix}.jsonl`);
    const relativePath = path.relative(recorderDirectory, recorderPath);
    if (relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)) {
        throw new CrablineError("Generated provider recorder path escapes its directory.", {
            kind: "config",
        });
    }
    return recorderPath;
}
function toRecorderPath(providerId, configuredPath) {
    return configuredPath
        ? path.resolve(configuredPath)
        : resolveGeneratedLocalMockRecorderPath(providerId);
}
function authorFromPayload(payload) {
    const explicit = payload.message?.author ?? payload.author;
    if (explicit) {
        return explicit;
    }
    return (payload.message?.authorIsBot ?? payload.authorIsBot ?? true) ? "assistant" : "user";
}
function normalizeWebhookPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new CrablineError("mock webhook payload must be an object", { kind: "inbound" });
    }
    const record = payload;
    const messageValue = record.message;
    if (messageValue !== undefined &&
        (!messageValue || typeof messageValue !== "object" || Array.isArray(messageValue))) {
        throw new CrablineError("mock webhook payload message must be an object", {
            kind: "inbound",
        });
    }
    for (const [label, envelope] of [
        ["payload", record],
        ["payload.message", messageValue],
    ]) {
        if (!envelope) {
            continue;
        }
        if (envelope.author !== undefined &&
            envelope.author !== "assistant" &&
            envelope.author !== "system" &&
            envelope.author !== "user") {
            throw new CrablineError(`${label}.author must be assistant, system, or user`, {
                kind: "inbound",
            });
        }
        if (envelope.authorIsBot !== undefined && typeof envelope.authorIsBot !== "boolean") {
            throw new CrablineError(`${label}.authorIsBot must be a boolean`, { kind: "inbound" });
        }
        for (const field of ["id", "threadId"]) {
            const value = envelope[field];
            if (value !== undefined && (typeof value !== "string" || value.length === 0)) {
                throw new CrablineError(`${label}.${field} must be a non-empty string`, {
                    kind: "inbound",
                });
            }
        }
        if (envelope.text !== undefined && typeof envelope.text !== "string") {
            throw new CrablineError(`${label}.text must be a string`, {
                kind: "inbound",
            });
        }
    }
    return payload;
}
function mockReplyText(params) {
    return `[${params.platform} mock] ${params.text}`;
}
function reportPostCommitWebhookSettlementFailure(providerId, error) {
    try {
        process.emitWarning(`Webhook acceptance committed for provider ${JSON.stringify(providerId)}, but settlement failed: ${ensureErrorMessage(error)}`, {
            code: "CRABLINE_WEBHOOK_SETTLEMENT",
            type: "ProviderWebhookWarning",
        });
    }
    catch {
        // Error reporting must not change the result of an accepted webhook.
    }
}
async function settleWebhookHandlers(providerId, handlers, graceMs) {
    if (handlers.length === 0) {
        return;
    }
    let timer;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new CrablineError(`Provider "${providerId}" webhook handlers did not settle within ${graceMs}ms after cleanup.`, { kind: "timeout" }));
        }, graceMs);
    });
    try {
        await Promise.race([Promise.allSettled(handlers).then(() => undefined), deadline]);
    }
    finally {
        clearTimeout(timer);
    }
}
export class LocalMockProviderAdapter {
    id;
    platform;
    status = "ready";
    supports;
    #codec;
    #config;
    #options;
    #publicUrl;
    #recorderPath;
    #webhookCleanupGraceMs;
    #activeSends = new Set();
    #activeWebhookHandlers = new Set();
    #cleanupController = new AbortController();
    #waitCursors = new Map();
    #cleanupBegun = false;
    #cleanupPromise = null;
    #server = null;
    #serverClosing = null;
    #serverStarting = null;
    constructor(params) {
        this.id = params.id;
        this.platform = params.options.platform;
        this.supports = [...params.config.capabilities];
        this.#codec = params.codec;
        this.#config = params.config;
        this.#options = params.options;
        this.#publicUrl = params.options.publicUrl ?? params.options.webhook?.publicUrl;
        this.#recorderPath = toRecorderPath(params.id, params.options.recorderPath);
        const webhookCleanupGraceMs = params.options.webhookCleanupGraceMs ?? DEFAULT_WEBHOOK_CLEANUP_GRACE_MS;
        if (!Number.isSafeInteger(webhookCleanupGraceMs) || webhookCleanupGraceMs < 1) {
            throw new CrablineError("Webhook cleanup grace must be a positive safe integer.", {
                kind: "config",
            });
        }
        this.#webhookCleanupGraceMs = webhookCleanupGraceMs;
        this.#installCleanupFence();
    }
    normalizeTarget(target) {
        this.#assertActive();
        return this.#codec.normalize(target);
    }
    async probe(context) {
        context.signal?.throwIfAborted();
        const server = await this.#ensureWebhookServer();
        context.signal?.throwIfAborted();
        const target = this.normalizeTarget(context.fixture.target);
        const details = [
            `${this.platform} local mock ready`,
            `recorder path ${this.#recorderPath}`,
            `${this.#options.endpointLabel} ${server.endpointUrl}`,
        ];
        if (this.#publicUrl) {
            details.push(`public webhook ${this.#publicUrl}`);
        }
        if (target.threadId) {
            details.push(`thread reachable ${target.threadId}`);
        }
        else if (target.channelId) {
            details.push(`channel reachable ${target.channelId}`);
        }
        else {
            details.push(`dm reachable ${this.#codec.resolveThreadId(context.fixture.target)}`);
        }
        return { details, healthy: true };
    }
    send(context) {
        try {
            this.#assertActive();
        }
        catch (error) {
            return Promise.reject(error);
        }
        const sending = this.#send(context);
        this.#activeSends.add(sending);
        void sending.then(() => this.#activeSends.delete(sending), () => this.#activeSends.delete(sending));
        return sending;
    }
    async #send(context) {
        const signal = this.#signalFor(context.signal);
        const threadId = this.#codec.resolveThreadId(context.fixture.target);
        const messageId = createMessageId(this.platform);
        signal.throwIfAborted();
        const events = [
            {
                author: "user",
                id: messageId,
                provider: this.id,
                raw: {
                    direction: "outbound",
                    mode: context.mode,
                    platform: this.platform,
                },
                recordedDirection: "outbound",
                sentAt: new Date().toISOString(),
                text: context.text,
                threadId,
            },
        ];
        if (context.mode !== "send" && context.fixture.target.behavior !== "sink") {
            await sleep(this.#config.loopback?.delayMs ?? 25, signal);
            signal.throwIfAborted();
            events.push({
                author: "assistant",
                id: `${messageId}-reply`,
                provider: this.id,
                raw: {
                    direction: "mock-reply",
                    mode: context.mode,
                    platform: this.platform,
                },
                recordedDirection: "inbound",
                sentAt: new Date().toISOString(),
                text: mockReplyText({ platform: this.platform, text: context.text }),
                threadId,
            });
        }
        await appendRecordedInboundBatch(this.#recorderPath, events);
        return {
            accepted: true,
            messageId,
            threadId,
        };
    }
    async waitForInbound(context) {
        this.#assertActive();
        const signal = this.#signalFor(context.signal);
        await this.#ensureWebhookServer();
        const target = this.normalizeTarget(context.fixture.target);
        const expectedAuthor = context.fixture.inboundMatch.author;
        const channelId = context.threadId ?? target.threadId ?? target.channelId;
        const excludedIds = new Set(context.excludeIds ?? []);
        const cursorKey = JSON.stringify([context.nonce, context.since, channelId, expectedAuthor]);
        const cursorState = this.#waitCursors.get(cursorKey) ?? { active: 0 };
        const cursor = cursorState.cursor
            ? cloneRecordedInboundCursor(cursorState.cursor)
            : createRecordedInboundCursor();
        cursorState.active++;
        this.#waitCursors.delete(cursorKey);
        this.#waitCursors.set(cursorKey, cursorState);
        pruneInactiveWaitCursors(this.#waitCursors);
        try {
            const event = await waitForRecordedInbound({
                cursor,
                filePath: this.#recorderPath,
                matches: (candidate) => candidate.provider === this.id &&
                    !excludedIds.has(candidate.id) &&
                    (expectedAuthor === "any" || candidate.author === expectedAuthor) &&
                    (this.#options.matchesThread ?? isAddressInChannel)(candidate.threadId, channelId, target, candidate.raw),
                recordedDirection: "inbound",
                since: context.since,
                signal,
                timeoutMs: context.timeoutMs,
            });
            if (this.#waitCursors.get(cursorKey) === cursorState &&
                cursorHasAdvanced(cursor, cursorState.cursor)) {
                cursorState.cursor = cursor;
            }
            return event;
        }
        finally {
            cursorState.active--;
            if (cursorState.active === 0 &&
                !cursorState.cursor &&
                this.#waitCursors.get(cursorKey) === cursorState) {
                this.#waitCursors.delete(cursorKey);
            }
            pruneInactiveWaitCursors(this.#waitCursors);
        }
    }
    async *watch(context) {
        this.#assertActive();
        const signal = this.#signalFor(context.signal);
        await this.#ensureWebhookServer();
        const target = this.normalizeTarget(context.fixture.target);
        for await (const event of watchRecordedInbound({
            filePath: this.#recorderPath,
            matches: (entry) => entry.provider === this.id &&
                (this.#options.matchesThread ?? isAddressInChannel)(entry.threadId, target.threadId ?? target.channelId, target, entry.raw),
            recordedDirection: "inbound",
            signal,
            since: context.since,
        })) {
            yield event;
        }
    }
    #beginCleanup() {
        if (this.#cleanupBegun) {
            return;
        }
        this.#cleanupBegun = true;
        this.#cleanupController.abort(this.#cleanedUpError());
        this.#waitCursors.clear();
        this.#serverClosing = this.#closeWebhookServer();
        void this.#serverClosing.catch(() => undefined);
    }
    #installCleanupFence() {
        const adapter = this;
        if (adapter.beginCleanup) {
            return;
        }
        Object.defineProperty(adapter, "beginCleanup", {
            value: () => this.#beginCleanup(),
        });
    }
    async cleanup() {
        this.#beginCleanup();
        this.#cleanupPromise ??= (async () => {
            const sends = [...this.#activeSends];
            const webhookHandlers = [...this.#activeWebhookHandlers];
            const results = await Promise.allSettled([
                this.#serverClosing,
                ...sends,
                settleWebhookHandlers(this.id, webhookHandlers, this.#webhookCleanupGraceMs),
            ]);
            const serverResult = results[0];
            if (serverResult?.status === "rejected") {
                throw serverResult.reason;
            }
            const webhookResult = results.at(-1);
            if (webhookResult?.status === "rejected") {
                throw webhookResult.reason;
            }
        })();
        await this.#cleanupPromise;
    }
    #handleWebhook(request) {
        if (this.#cleanupBegun) {
            return Promise.resolve(new Response("provider is shutting down", { status: 503 }));
        }
        const admittedRequest = new Request(request, {
            signal: this.#signalFor(request.signal),
        });
        const handling = this.#handleAdmittedWebhook(admittedRequest);
        this.#activeWebhookHandlers.add(handling);
        void handling.then(() => this.#activeWebhookHandlers.delete(handling), () => this.#activeWebhookHandlers.delete(handling));
        return handling;
    }
    async #handleAdmittedWebhook(request) {
        const rawBody = await request.text();
        const authenticationFailure = await this.#options.authenticateWebhookRequest?.(request, rawBody);
        if (authenticationFailure) {
            return authenticationFailure;
        }
        const isJson = isJsonMediaType(request.headers.get("content-type") ?? "");
        let rawPayload;
        if (isJson) {
            try {
                rawPayload = JSON.parse(rawBody);
            }
            catch {
                this.#options.settleWebhookRequest?.({
                    accepted: false,
                    payload: undefined,
                    rawBody,
                });
                return new Response("invalid JSON", { status: 400 });
            }
        }
        else {
            rawPayload = rawBody;
        }
        let settled = false;
        const settle = (accepted) => {
            if (settled) {
                return;
            }
            settled = true;
            this.#options.settleWebhookRequest?.({ accepted, payload: rawPayload, rawBody });
        };
        const respond = (response) => {
            settle(response.ok);
            return response;
        };
        let uncommittedResponse;
        const settleCommittedAcceptance = () => {
            if (settled) {
                return;
            }
            settled = true;
            try {
                this.#options.settleWebhookRequest?.({
                    accepted: true,
                    payload: rawPayload,
                    rawBody,
                });
            }
            catch (error) {
                reportPostCommitWebhookSettlementFailure(this.id, error);
            }
        };
        try {
            const directResponse = await this.#options.handleWebhookPayload?.(rawPayload, request, rawBody);
            if (directResponse) {
                return respond(directResponse);
            }
            if (!isJson) {
                return respond(new Response("expected application/json", { status: 415 }));
            }
            let payload;
            try {
                payload = normalizeWebhookPayload(this.#options.normalizeWebhookPayload
                    ? this.#options.normalizeWebhookPayload(rawPayload)
                    : rawPayload);
            }
            catch (error) {
                if (error instanceof CrablineError && error.kind === "inbound") {
                    return respond(new Response(ensureErrorMessage(error), { status: 400 }));
                }
                throw error;
            }
            const id = payload.message?.id ?? payload.id ?? createMessageId(this.platform);
            const threadId = payload.message?.threadId ?? payload.threadId;
            const text = payload.message?.text ?? payload.text;
            if (!threadId || text === undefined) {
                return respond(new Response("payload requires message.threadId and message.text", { status: 400 }));
            }
            const successResponse = (await this.#options.createWebhookSuccessResponse?.(rawPayload, id)) ??
                new Response(JSON.stringify({ ok: true, id }), {
                    headers: { "content-type": "application/json" },
                    status: 200,
                });
            uncommittedResponse = successResponse;
            await appendRecordedInbound(this.#recorderPath, {
                author: authorFromPayload(payload),
                id,
                provider: this.id,
                raw: payload.message?.raw ?? payload.raw ?? payload,
                recordedDirection: "inbound",
                sentAt: new Date().toISOString(),
                text,
                threadId,
            });
            settleCommittedAcceptance();
            uncommittedResponse = undefined;
            return successResponse;
        }
        catch (error) {
            void uncommittedResponse?.body?.cancel(error).catch(() => undefined);
            settle(false);
            throw error;
        }
    }
    async #ensureWebhookServer() {
        if (this.#cleanupBegun) {
            throw this.#cleanedUpError();
        }
        if (this.#server) {
            return this.#server;
        }
        if (this.#serverStarting) {
            return await this.#serverStarting;
        }
        const webhook = this.#options.webhook;
        const host = webhook?.host ?? this.#options.defaultWebhook.host;
        const port = webhook?.port ?? this.#options.defaultWebhook.port;
        const webhookPath = webhook?.path ?? this.#options.defaultWebhook.path;
        const starting = (async () => {
            try {
                return await startWebhookServer({
                    handle: (request) => this.#handleWebhook(request),
                    host,
                    methods: this.#options.webhookMethods ??
                        (this.#options.handleWebhookPayload ? ["GET", "POST"] : ["POST"]),
                    path: webhookPath,
                    port,
                    ...(this.#options.preflightWebhookRequest
                        ? { preflight: this.#options.preflightWebhookRequest }
                        : {}),
                });
            }
            catch (error) {
                throw new CrablineError(`${this.platform} local mock webhook server failed: ${ensureErrorMessage(error)}`, { cause: error, kind: "connectivity" });
            }
        })();
        this.#serverStarting = starting;
        try {
            const server = await starting;
            if (this.#cleanupBegun) {
                throw this.#cleanedUpError();
            }
            this.#server = server;
            return server;
        }
        finally {
            if (this.#serverStarting === starting) {
                this.#serverStarting = null;
            }
        }
    }
    async #closeWebhookServer() {
        let server = this.#server;
        if (!server && this.#serverStarting) {
            try {
                server = await this.#serverStarting;
            }
            catch {
                return;
            }
        }
        if (!server) {
            return;
        }
        if (this.#server === server) {
            this.#server = null;
        }
        await server.close();
    }
    #cleanedUpError() {
        return new CrablineError(`Provider "${this.id}" has been cleaned up.`, { kind: "config" });
    }
    #assertActive() {
        if (this.#cleanupBegun) {
            throw this.#cleanedUpError();
        }
    }
    #signalFor(signal) {
        return signal
            ? AbortSignal.any([signal, this.#cleanupController.signal])
            : this.#cleanupController.signal;
    }
}
//# sourceMappingURL=local-mock.js.map