export type ProxylineTlsOptions = Readonly<{
    ca?: string;
    caFile?: string;
}>;
export declare class ProxylineError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/** Decode proxy userinfo; invalid percent-encoding must not throw URIError mid-CONNECT. */
export declare function decodeProxyUserinfoComponent(value: string): string;
export declare function resolveProxyTlsCa(options: ProxylineTlsOptions | undefined): string | undefined;
export declare function formatUrl(value: string | URL): string;
export declare function redactProxyUrl(value: string | URL): string;
//# sourceMappingURL=shared.d.ts.map