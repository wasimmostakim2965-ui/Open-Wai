import { createServer } from "node:http";
import { isCanonicalHttpPath } from "../core/http-path.js";
import { advertisedHostForBindAddress, assertLoopbackBindAddress, closeServer, drainRequestBody, formatUrlHost, writeFetchResponseHeaders, } from "../servers/http.js";
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_BODY_TIMEOUT_MS = 5_000;
const MAX_NODE_TIMER_DELAY_MS = 2_147_483_647;
class RequestBodyTooLargeError extends Error {
}
class RequestBodyTimeoutError extends Error {
}
class ResponseDeliveryClosedError extends Error {
}
function requirePositiveSafeInteger(value, name) {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive safe integer.`);
    }
    return value;
}
function requireTimerDelay(value, name) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_NODE_TIMER_DELAY_MS) {
        throw new Error(`${name} must be a positive integer no greater than ${MAX_NODE_TIMER_DELAY_MS}.`);
    }
    return value;
}
async function readRequestBody(request, maxBodyBytes, bodyTimeoutMs) {
    if (request.aborted) {
        throw new Error("request body aborted");
    }
    return await new Promise((resolve, reject) => {
        const chunks = [];
        let bodyBytes = 0;
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeout);
            request.off("data", onData);
            request.off("end", onEnd);
            request.off("error", onError);
            request.off("aborted", onAborted);
        };
        const fail = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            drainRequestBodyWithDeadline(request, bodyTimeoutMs);
            reject(error);
        };
        const onData = (chunk) => {
            if (settled) {
                return;
            }
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bodyBytes += buffer.length;
            if (bodyBytes > maxBodyBytes) {
                fail(new RequestBodyTooLargeError());
                return;
            }
            chunks.push(buffer);
        };
        const onEnd = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(Buffer.concat(chunks));
        };
        const onError = (error) => fail(error);
        const onAborted = () => fail(new Error("request body aborted"));
        const timeout = setTimeout(() => {
            fail(new RequestBodyTimeoutError());
        }, bodyTimeoutMs);
        request.on("data", onData);
        request.once("end", onEnd);
        request.once("error", onError);
        request.once("aborted", onAborted);
        if (request.aborted) {
            onAborted();
        }
    });
}
function drainRequestBodyWithDeadline(request, bodyTimeoutMs) {
    if (request.destroyed || request.readableEnded) {
        return;
    }
    const socket = request.socket;
    const timeout = setTimeout(() => socket.destroy(), bodyTimeoutMs);
    timeout.unref();
    const cleanup = () => {
        clearTimeout(timeout);
        request.off("end", cleanup);
        socket.off("close", cleanup);
    };
    request.once("end", cleanup);
    socket.once("close", cleanup);
    drainRequestBody(request);
}
async function toFetchRequest(request, url, maxBodyBytes, bodyTimeoutMs, signal) {
    const requestBody = await readRequestBody(request, maxBodyBytes, bodyTimeoutMs);
    const body = request.method === "GET" || request.method === "HEAD" || requestBody.length === 0
        ? undefined
        : requestBody;
    const init = {
        headers: request.headers,
        signal,
    };
    if (request.method) {
        init.method = request.method;
    }
    if (body) {
        init.body = body;
        init.duplex = "half";
    }
    return new Request(url, init);
}
function toFetchRequestMetadata(request, url, signal) {
    return new Request(url, {
        headers: request.headers,
        ...(request.method ? { method: request.method } : {}),
        signal,
    });
}
function trackRequestLifetime(request) {
    const controller = new AbortController();
    const abort = () => {
        if (!controller.signal.aborted) {
            controller.abort(new DOMException("Webhook client disconnected.", "AbortError"));
        }
    };
    request.once("aborted", abort);
    request.socket.once("close", abort);
    if (request.aborted || request.socket.destroyed) {
        abort();
    }
    return {
        dispose() {
            request.off("aborted", abort);
            request.socket.off("close", abort);
        },
        signal: controller.signal,
    };
}
async function writeFetchResponse(response, fetchResponse) {
    response.statusCode = fetchResponse.status;
    writeFetchResponseHeaders(response, fetchResponse);
    const reader = fetchResponse.body?.getReader();
    let cancellation;
    let rejectStopped;
    let stoppedError;
    const stopped = new Promise((_, reject) => {
        rejectStopped = reject;
    });
    void stopped.catch(() => { });
    const cancelBody = (reason) => {
        if (!reader || cancellation) {
            return;
        }
        cancellation = reader.cancel(reason).catch(() => { });
    };
    const stop = (error) => {
        if (stoppedError) {
            return;
        }
        stoppedError = error;
        cancelBody(error);
        rejectStopped(error);
    };
    const onClose = () => {
        if (!response.writableFinished) {
            stop(new ResponseDeliveryClosedError("Webhook response delivery closed before completion."));
        }
    };
    const onError = (error) => stop(error);
    response.once("close", onClose);
    response.once("error", onError);
    try {
        if (response.destroyed ||
            response.req?.aborted ||
            response.req?.socket.destroyed ||
            response.socket?.destroyed) {
            throw new ResponseDeliveryClosedError("Webhook response delivery closed before it started.");
        }
        if (reader) {
            while (true) {
                const chunk = await Promise.race([reader.read(), stopped]);
                if (chunk.done) {
                    break;
                }
                if (chunk.value.byteLength > 0 && !response.write(chunk.value)) {
                    let onDrain;
                    const drained = new Promise((resolve) => {
                        onDrain = resolve;
                        response.once("drain", onDrain);
                    });
                    try {
                        await Promise.race([drained, stopped]);
                    }
                    finally {
                        response.off("drain", onDrain);
                    }
                }
            }
        }
        let onFinish;
        const finished = new Promise((resolve) => {
            onFinish = resolve;
            response.once("finish", onFinish);
        });
        try {
            response.end();
            await Promise.race([finished, stopped]);
        }
        finally {
            response.off("finish", onFinish);
        }
    }
    catch (error) {
        cancelBody(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        response.off("close", onClose);
        response.off("error", onError);
    }
}
function clearUnsentResponseHeaders(response) {
    if (response.headersSent) {
        return;
    }
    for (const name of response.getHeaderNames()) {
        response.removeHeader(name);
    }
}
export async function startWebhookServer(params) {
    params.signal?.throwIfAborted();
    if (!isCanonicalHttpPath(params.path)) {
        throw new Error("Webhook path must be a canonical URL pathname.");
    }
    const methods = new Set(params.methods ?? ["POST"]);
    const maxBodyBytes = requirePositiveSafeInteger(params.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES, "Webhook maxBodyBytes");
    const bodyTimeoutMs = requireTimerDelay(params.bodyTimeoutMs ?? DEFAULT_BODY_TIMEOUT_MS, "Webhook bodyTimeoutMs");
    const shutdownGraceMs = params.shutdownGraceMs === undefined
        ? undefined
        : requireTimerDelay(params.shutdownGraceMs, "Webhook shutdownGraceMs");
    let closing = false;
    const server = createServer(async (request, response) => {
        const requestLifetime = trackRequestLifetime(request);
        try {
            if (closing) {
                drainRequestBodyWithDeadline(request, bodyTimeoutMs);
                await writeFetchResponse(response, new Response("provider is shutting down", {
                    headers: { connection: "close" },
                    status: 503,
                }));
                return;
            }
            const method = request.method ?? "GET";
            const host = request.headers.host ?? "127.0.0.1";
            const url = new URL(request.url ?? "/", `http://${host}`);
            if (!methods.has(method) || url.pathname !== params.path) {
                drainRequestBodyWithDeadline(request, bodyTimeoutMs);
                await writeFetchResponse(response, new Response("not found", { status: 404 }));
                return;
            }
            const preflightResponse = await params.preflight?.(toFetchRequestMetadata(request, url, requestLifetime.signal));
            if (preflightResponse) {
                drainRequestBodyWithDeadline(request, bodyTimeoutMs);
                await writeFetchResponse(response, preflightResponse);
                return;
            }
            const fetchRequest = await toFetchRequest(request, url, maxBodyBytes, bodyTimeoutMs, requestLifetime.signal);
            await writeFetchResponse(response, await params.handle(fetchRequest));
        }
        catch (error) {
            if (error instanceof ResponseDeliveryClosedError) {
                response.destroy();
                return;
            }
            const status = error instanceof RequestBodyTooLargeError
                ? 413
                : error instanceof RequestBodyTimeoutError
                    ? 408
                    : 500;
            if (status === 500) {
                try {
                    params.onError?.(error);
                }
                catch {
                    // Error reporting must not change the public response.
                }
            }
            if (response.headersSent || response.destroyed) {
                response.destroy();
                return;
            }
            clearUnsentResponseHeaders(response);
            try {
                await writeFetchResponse(response, new Response(status === 413
                    ? "request body too large"
                    : status === 408
                        ? "request body timeout"
                        : "internal server error", {
                    ...(status === 408 || status === 413 ? { headers: { connection: "close" } } : {}),
                    status,
                }));
            }
            catch {
                response.destroy();
            }
        }
        finally {
            requestLifetime.dispose();
        }
    });
    await new Promise((resolve, reject) => {
        let abortCloseStarted = false;
        let aborting = false;
        let settled = false;
        const cleanup = () => {
            server.off("error", onError);
            params.signal?.removeEventListener("abort", onAbort);
        };
        const fail = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        };
        const onError = (error) => fail(error);
        const closeAbortedStartup = () => {
            if (!aborting || abortCloseStarted || !server.listening) {
                return;
            }
            abortCloseStarted = true;
            const reason = params.signal?.reason ?? new DOMException("Webhook startup aborted", "AbortError");
            void closeServer(server, shutdownGraceMs).then(() => fail(reason), (closeError) => fail(new AggregateError([reason, closeError], "Webhook startup was aborted and listener cleanup failed.")));
        };
        const onAbort = () => {
            if (settled || aborting) {
                return;
            }
            aborting = true;
            closing = true;
            closeAbortedStartup();
        };
        server.once("error", onError);
        params.signal?.addEventListener("abort", onAbort, { once: true });
        server.listen(params.port, params.host, () => {
            if (aborting) {
                closeAbortedStartup();
                return;
            }
            settled = true;
            cleanup();
            resolve();
        });
        if (params.signal?.aborted) {
            onAbort();
        }
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Unable to resolve webhook server address.");
    }
    try {
        assertLoopbackBindAddress(params.host, address.address, "Webhook server");
    }
    catch (error) {
        await closeServer(server, shutdownGraceMs);
        throw error;
    }
    const advertisedHost = advertisedHostForBindAddress(params.host, address.address);
    let closingPromise = null;
    return {
        async close() {
            closing = true;
            closingPromise ??= closeServer(server, shutdownGraceMs);
            await closingPromise;
        },
        endpointUrl: `http://${formatUrlHost(advertisedHost)}:${address.port}${params.path}`,
    };
}
//# sourceMappingURL=webhook-server.js.map