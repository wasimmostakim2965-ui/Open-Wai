import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { createHash, timingSafeEqual } from "node:crypto";
import { BlockList, isIP } from "node:net";
import { CrablineError } from "../core/errors.js";
export const ADMIN_TOKEN_HEADER = "x-crabline-admin-token";
export const DEFAULT_MAX_REQUEST_BODY_BYTES = 1024 * 1024;
export const DEFAULT_MAX_RESPONSE_BODY_BYTES = 8 * 1024 * 1024;
export const DEFAULT_SERVER_SHUTDOWN_GRACE_MS = 250;
const DRAINING_REQUESTS = new WeakSet();
const LOOPBACK_ADDRESSES = new BlockList();
LOOPBACK_ADDRESSES.addSubnet("127.0.0.0", 8, "ipv4");
LOOPBACK_ADDRESSES.addAddress("::1", "ipv6");
LOOPBACK_ADDRESSES.addSubnet("::ffff:127.0.0.0", 104, "ipv6");
const UNSPECIFIED_ADDRESSES = new BlockList();
UNSPECIFIED_ADDRESSES.addAddress("0.0.0.0", "ipv4");
UNSPECIFIED_ADDRESSES.addAddress("::", "ipv6");
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);
export class InvalidJsonBodyError extends Error {
    constructor(cause, message = "Request body is not valid JSON.") {
        super(message, { cause });
        this.name = "InvalidJsonBodyError";
    }
}
export class RequestBodyTooLargeError extends Error {
    maxBytes;
    constructor(maxBytes) {
        super(`Request body exceeds the ${maxBytes} byte limit.`);
        this.maxBytes = maxBytes;
        this.name = "RequestBodyTooLargeError";
    }
}
export class ResponseBodyTooLargeError extends Error {
    maxBytes;
    constructor(maxBytes) {
        super(`Response body exceeds the ${maxBytes} byte limit.`);
        this.maxBytes = maxBytes;
        this.name = "ResponseBodyTooLargeError";
    }
}
export function jsonResponse(value, status = 200) {
    return Response.json(value, { status });
}
export function drainRequestBody(request) {
    if (request.readableEnded || DRAINING_REQUESTS.has(request)) {
        return;
    }
    DRAINING_REQUESTS.add(request);
    const ignoreError = () => { };
    request.on("error", ignoreError);
    if (request.destroyed) {
        // IncomingMessage may emit its terminal error after destroyed becomes true.
        return;
    }
    const cleanup = () => {
        DRAINING_REQUESTS.delete(request);
        request.off("close", cleanup);
        request.off("end", cleanup);
        request.off("error", ignoreError);
    };
    request.once("close", cleanup);
    request.once("end", cleanup);
    request.resume();
}
export async function readBody(request, maxBytes = DEFAULT_MAX_REQUEST_BODY_BYTES) {
    requirePositiveSafeInteger(maxBytes, "maxBytes");
    if (request.aborted) {
        throw new Error("Request body stream was aborted.");
    }
    const contentLengthHeader = request.headers["content-length"];
    const contentLengthValue = Array.isArray(contentLengthHeader)
        ? contentLengthHeader[0]
        : contentLengthHeader;
    if (contentLengthValue && /^\d+$/u.test(contentLengthValue)) {
        const contentLength = Number(contentLengthValue);
        if (!Number.isSafeInteger(contentLength) || contentLength > maxBytes) {
            drainRequestBody(request);
            throw new RequestBodyTooLargeError(maxBytes);
        }
    }
    return await new Promise((resolve, reject) => {
        const chunks = [];
        let length = 0;
        let settled = false;
        const cleanup = () => {
            request.off("aborted", onAborted);
            request.off("data", onData);
            request.off("end", onEnd);
            request.off("error", onError);
        };
        const fail = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            drainRequestBody(request);
            cleanup();
            reject(error);
        };
        const onAborted = () => fail(new Error("Request body stream was aborted."));
        const onData = (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            length += buffer.length;
            if (length > maxBytes) {
                fail(new RequestBodyTooLargeError(maxBytes));
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
            resolve(Buffer.concat(chunks, length));
        };
        const onError = (error) => fail(error);
        request.on("aborted", onAborted);
        request.on("data", onData);
        request.on("end", onEnd);
        request.on("error", onError);
        if (request.aborted) {
            onAborted();
        }
    });
}
export async function parseUnknownRequestBody(request, maxBytes = DEFAULT_MAX_REQUEST_BODY_BYTES) {
    const body = await readBody(request, maxBytes);
    if (body.length === 0) {
        return {};
    }
    const contentType = request.headers["content-type"] ?? "";
    const isJson = Array.isArray(contentType)
        ? contentType.some(isJsonMediaType)
        : isJsonMediaType(contentType);
    if (isJson) {
        try {
            return JSON.parse(body.toString("utf8"));
        }
        catch (error) {
            throw new InvalidJsonBodyError(error);
        }
    }
    const params = new URLSearchParams(body.toString("utf8"));
    return Object.fromEntries(params.entries());
}
export function isJsonMediaType(value) {
    const mediaType = value.split(";", 1)[0]?.trim().toLowerCase();
    return (mediaType === "application/json" ||
        /^[a-z0-9!#$%&'*+.^_`|~-]+\/[a-z0-9!#$%&'*+.^_`|~-]+\+json$/u.test(mediaType ?? ""));
}
export async function parseRequestBody(request) {
    const body = await parseUnknownRequestBody(request);
    if (!isJsonObject(body)) {
        throw new InvalidJsonBodyError(undefined, "Request body must be a JSON object.");
    }
    return body;
}
export function isJsonObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function queryRecord(url) {
    return Object.fromEntries(url.searchParams.entries());
}
export function formatUrlHost(host) {
    return host.includes(":") ? `[${host}]` : host;
}
function normalizeHost(host) {
    return host
        .trim()
        .replace(/^\[(.*)\]$/u, "$1")
        .toLowerCase()
        .replace(/\.$/u, "");
}
export function isLoopbackAddress(address) {
    const normalized = normalizeHost(address);
    const family = isIP(normalized);
    return family === 4
        ? LOOPBACK_ADDRESSES.check(normalized, "ipv4")
        : family === 6
            ? LOOPBACK_ADDRESSES.check(normalized, "ipv6")
            : false;
}
export function isLoopbackHost(host) {
    const normalized = normalizeHost(host);
    if (normalized === "localhost" || normalized.endsWith(".localhost")) {
        return true;
    }
    return isLoopbackAddress(normalized);
}
export function advertisedHostForBindAddress(host, boundAddress) {
    const normalizedBoundAddress = normalizeHost(boundAddress);
    const boundFamily = isIP(normalizedBoundAddress);
    if (boundFamily === 4 && UNSPECIFIED_ADDRESSES.check(normalizedBoundAddress, "ipv4")) {
        return "127.0.0.1";
    }
    if (boundFamily === 6 && UNSPECIFIED_ADDRESSES.check(normalizedBoundAddress, "ipv6")) {
        return "::1";
    }
    return isLoopbackHost(host) && isLoopbackAddress(boundAddress) ? boundAddress : host;
}
export function assertLoopbackBindAddress(configuredHost, boundAddress, serverName) {
    if (isLoopbackHost(configuredHost) && !isLoopbackAddress(boundAddress)) {
        throw new CrablineError(`${serverName} resolved a loopback hostname to non-loopback address ${boundAddress}.`, { kind: "connectivity" });
    }
}
export function writeFetchResponseHeaders(response, fetchResponse) {
    const preserveRepresentationLength = response.req?.method === "HEAD" || fetchResponse.status === 304;
    const connectionHeaders = new Set((fetchResponse.headers.get("connection") ?? "")
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean));
    if (connectionHeaders.has("close")) {
        response.shouldKeepAlive = false;
    }
    for (const [name, value] of fetchResponse.headers) {
        const normalizedName = name.toLowerCase();
        if (normalizedName === "set-cookie" ||
            HOP_BY_HOP_RESPONSE_HEADERS.has(normalizedName) ||
            connectionHeaders.has(normalizedName) ||
            (normalizedName === "content-length" && !preserveRepresentationLength)) {
            continue;
        }
        response.setHeader(name, value);
    }
    const setCookies = fetchResponse.headers.getSetCookie();
    if (setCookies.length > 0 && !connectionHeaders.has("set-cookie")) {
        response.setHeader("set-cookie", setCookies);
    }
}
export async function writeResponse(response, fetchResponse, maxBytes = DEFAULT_MAX_RESPONSE_BODY_BYTES) {
    requirePositiveSafeInteger(maxBytes, "maxResponseBodyBytes");
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
            stop(new Error("HTTP response closed before delivery completed."));
        }
    };
    const onError = (error) => stop(error);
    const onRequestAborted = () => stop(new Error("HTTP response request was aborted."));
    response.once("close", onClose);
    response.once("error", onError);
    response.req?.once("aborted", onRequestAborted);
    try {
        if (response.destroyed ||
            response.req?.aborted ||
            response.req?.socket.destroyed ||
            response.socket?.destroyed) {
            throw new Error("HTTP response closed before delivery completed.");
        }
        if (response.req?.method === "HEAD") {
            cancelBody(new Error("HEAD response body is not transferred."));
            response.statusCode = fetchResponse.status;
            writeFetchResponseHeaders(response, fetchResponse);
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
            return;
        }
        const chunks = [];
        let bodyLength = 0;
        if (reader) {
            while (true) {
                const chunk = await Promise.race([reader.read(), stopped]);
                if (chunk.done) {
                    break;
                }
                if (chunk.value.byteLength > 0) {
                    if (bodyLength + chunk.value.byteLength > maxBytes) {
                        throw new ResponseBodyTooLargeError(maxBytes);
                    }
                    const buffer = Buffer.from(chunk.value);
                    chunks.push(buffer);
                    bodyLength += buffer.length;
                }
            }
        }
        const body = Buffer.concat(chunks, bodyLength);
        response.statusCode = fetchResponse.status;
        writeFetchResponseHeaders(response, fetchResponse);
        let onFinish;
        const finished = new Promise((resolve) => {
            onFinish = resolve;
            response.once("finish", onFinish);
        });
        try {
            response.end(body);
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
        response.req?.off("aborted", onRequestAborted);
    }
}
export function createServerClose(recorder, ...closeResources) {
    let closing;
    return () => (closing ??= (async () => {
        const results = await Promise.allSettled(closeResources.map(async (close) => await close()));
        // Let native polling responses finish during transport grace, then fence late writes.
        results.push(...(await Promise.allSettled([recorder.close()])));
        const errors = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
        if (errors.length === 1) {
            throw errors[0];
        }
        if (errors.length > 1) {
            throw new AggregateError(errors, "Server shutdown failed.");
        }
    })());
}
export function closeServer(server, graceMs = DEFAULT_SERVER_SHUTDOWN_GRACE_MS) {
    return new Promise((resolve, reject) => {
        const closeIdleInterval = setInterval(() => server.closeIdleConnections(), 25);
        closeIdleInterval.unref();
        const forceCloseTimer = setTimeout(() => {
            server.closeAllConnections();
        }, graceMs);
        forceCloseTimer.unref();
        server.close((error) => {
            clearInterval(closeIdleInterval);
            clearTimeout(forceCloseTimer);
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
        server.closeIdleConnections();
    });
}
export async function startHttpJsonServer(params) {
    const maxResponseBodyBytes = requirePositiveSafeInteger(params.maxResponseBodyBytes ?? DEFAULT_MAX_RESPONSE_BODY_BYTES, "maxResponseBodyBytes");
    const handleRequest = async (request, response) => {
        try {
            const result = await params.handle(request, response);
            drainRequestBody(request);
            const handled = result instanceof Response ? { response: result } : result;
            try {
                await writeResponse(response, handled.response, maxResponseBodyBytes);
            }
            catch (error) {
                await handled.onWriteFailure?.();
                throw error;
            }
            try {
                await handled.onWriteSuccess?.();
            }
            catch {
                // Delivery is already committed; lifecycle failures must not trigger another response.
            }
        }
        catch (error) {
            drainRequestBody(request);
            let handled;
            try {
                handled = params.handleError?.(error, request);
            }
            catch {
                handled = undefined;
            }
            try {
                await writeResponse(response, handled ??
                    jsonResponse({
                        error: "internal server error",
                        ok: false,
                    }, 500), maxResponseBodyBytes);
            }
            catch {
                response.destroy();
            }
        }
    };
    const listener = (request, response) => {
        void handleRequest(request, response);
    };
    const server = params.tls ? createHttpsServer(params.tls, listener) : createServer(listener);
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(params.port, params.host, () => {
            server.off("error", reject);
            resolve();
        });
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new CrablineError(`Unable to resolve ${params.serverName} local server address.`, {
            kind: "connectivity",
        });
    }
    try {
        assertLoopbackBindAddress(params.host, address.address, params.serverName);
    }
    catch (error) {
        await closeServer(server);
        throw error;
    }
    const advertisedHost = advertisedHostForBindAddress(params.host, address.address);
    return {
        baseUrl: `${params.tls ? "https" : "http"}://${formatUrlHost(advertisedHost)}:${address.port}`,
        async close() {
            await closeServer(server);
        },
        server,
    };
}
function requirePositiveSafeInteger(value, name) {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new RangeError(`${name} must be a positive safe integer.`);
    }
    return value;
}
export function readString(value) {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (typeof value === "number" || typeof value === "bigint") {
        return value.toString();
    }
    return undefined;
}
export function readTrimmedString(value) {
    const stringValue = readString(value)?.trim();
    return stringValue ? stringValue : undefined;
}
export function readInteger(value) {
    const stringValue = readTrimmedString(value);
    if (!stringValue || !/^-?\d+$/u.test(stringValue)) {
        return undefined;
    }
    const parsed = Number(stringValue);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}
function readBearerToken(authorization) {
    if (!authorization) {
        return undefined;
    }
    const trimmed = authorization.trimStart();
    if (trimmed.slice(0, 7).toLowerCase() !== "bearer ") {
        return undefined;
    }
    return trimmed.slice(7);
}
export function constantTimeTokenEqual(providedToken, expectedToken) {
    const provided = createHash("sha256").update(providedToken).digest();
    const expected = createHash("sha256").update(expectedToken).digest();
    return timingSafeEqual(provided, expected);
}
export function hasAdminToken(request, expectedToken) {
    const header = request.headers[ADMIN_TOKEN_HEADER];
    const directToken = Array.isArray(header) ? header[0] : header;
    const providedToken = directToken ?? readBearerToken(request.headers.authorization);
    if (!providedToken) {
        return false;
    }
    return constantTimeTokenEqual(providedToken, expectedToken);
}
export function adminAuthError() {
    return new Response("unauthorized", {
        headers: { "www-authenticate": "Bearer" },
        status: 401,
    });
}
//# sourceMappingURL=http.js.map