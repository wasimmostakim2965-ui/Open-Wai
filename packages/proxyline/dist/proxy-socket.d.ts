import net from "node:net";
import tls from "node:tls";
import { type ProxylineTlsOptions } from "./shared.js";
/** Connection controls scoped to the proxy hop, never the destination tunnel. */
export type ProxyConnectOptions = Readonly<Pick<net.TcpNetConnectOpts, "lookup"> & Pick<tls.ConnectionOptions, "ca" | "cert" | "key" | "passphrase" | "servername" | "rejectUnauthorized">>;
/** Callers validate the HTTP(S) proxy URL before opening its socket. */
export declare function connectToProxy(proxy: URL, proxyTls: ProxylineTlsOptions | undefined, controls?: ProxyConnectOptions): net.Socket | tls.TLSSocket;
//# sourceMappingURL=proxy-socket.d.ts.map