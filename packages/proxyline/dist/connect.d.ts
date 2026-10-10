import net from "node:net";
import tls from "node:tls";
import { type ProxyConnectOptions } from "./proxy-socket.js";
import { type ProxylineTlsOptions } from "./shared.js";
export type OpenProxyConnectTunnelOptions = Readonly<{
    proxyUrl: string | URL;
    proxyTls?: ProxylineTlsOptions;
    proxyConnect?: ProxyConnectOptions;
    targetHost: string;
    targetPort: number;
    /**
     * Overall budget for the CONNECT handshake.
     * Omit for the default (30s). Pass `0` (or a negative value) for no timeout.
     */
    timeoutMs?: number;
    signal?: AbortSignal;
}>;
/** Default CONNECT handshake budget when `timeoutMs` is omitted. */
export declare const DEFAULT_PROXY_CONNECT_TIMEOUT_MS = 30000;
/**
 * Resolve the CONNECT timeout to apply.
 * - `undefined` → default 30s
 * - `<= 0` → no timeout (unbounded)
 * - positive → truncated milliseconds
 */
export declare function resolveProxyConnectTimeoutMs(timeoutMs: number | undefined): number | undefined;
type ProxySocket = net.Socket | tls.TLSSocket;
export declare function formatConnectAuthority(targetHost: string, targetPort: number): string;
export declare function openProxyConnectTunnel(options: OpenProxyConnectTunnelOptions): Promise<ProxySocket>;
export {};
//# sourceMappingURL=connect.d.ts.map