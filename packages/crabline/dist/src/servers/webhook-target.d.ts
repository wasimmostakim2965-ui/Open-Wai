import { type ClientRequest, type IncomingHttpHeaders } from "node:http";
export type WebhookAddress = {
    address: string;
    family: 4 | 6;
};
export type WebhookTargetError = "https-required" | "private-address" | "unresolvable";
export type ValidatedWebhookTarget = {
    addresses: WebhookAddress[] | undefined;
} | {
    error: WebhookTargetError;
};
export type WebhookResponse = {
    headers: IncomingHttpHeaders;
    status: number;
};
export declare const MAX_CONCURRENT_WEBHOOK_DNS_LOOKUPS = 8;
type WebhookDnsLookupResult = ReadonlyArray<{
    address: string;
    family: number;
}>;
type WebhookDnsLookup = (hostname: string) => Promise<WebhookDnsLookupResult>;
export declare class WebhookDnsLookupPool {
    #private;
    private readonly maxConcurrent;
    private readonly lookupHostname;
    private readonly abortedLookupRecoveryMs;
    constructor(maxConcurrent: number, lookupHostname?: WebhookDnsLookup, abortedLookupRecoveryMs?: number);
    resolve(hostname: string, signal?: AbortSignal): Promise<WebhookDnsLookupResult>;
}
export declare function validateWebhookTarget(params: {
    allowLoopbackHttp: boolean;
    dnsLookupPool?: Pick<WebhookDnsLookupPool, "resolve"> | undefined;
    restrictPrivateAddresses: boolean;
    signal?: AbortSignal | undefined;
    url: URL;
}): Promise<ValidatedWebhookTarget>;
type PostWebhookRequestParams = {
    activeRequests?: Set<ClientRequest> | undefined;
    address?: WebhookAddress | undefined;
    body: string;
    headerEntries?: ReadonlyArray<readonly [string, string]> | undefined;
    signal?: AbortSignal | undefined;
    timeoutMs: number;
    url: URL;
};
export declare function postWebhookRequestWithResponse(params: PostWebhookRequestParams): Promise<WebhookResponse>;
export declare function postWebhookRequest(params: PostWebhookRequestParams): Promise<number>;
export {};
