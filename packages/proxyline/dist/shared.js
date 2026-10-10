import fs from "node:fs";
export class ProxylineError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "ProxylineError";
        this.code = code;
    }
}
/** Decode proxy userinfo; invalid percent-encoding must not throw URIError mid-CONNECT. */
export function decodeProxyUserinfoComponent(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        throw new ProxylineError("INVALID_PROXY_USERINFO", "Proxy username or password contains invalid percent-encoding.");
    }
}
export function resolveProxyTlsCa(options) {
    if (!options) {
        return undefined;
    }
    if (options.ca !== undefined) {
        return options.ca;
    }
    if (options.caFile !== undefined) {
        return fs.readFileSync(options.caFile, "utf8");
    }
    return undefined;
}
export function formatUrl(value) {
    return value instanceof URL ? value.href : new URL(value).href;
}
export function redactProxyUrl(value) {
    const url = value instanceof URL ? new URL(value.href) : new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.href;
}
