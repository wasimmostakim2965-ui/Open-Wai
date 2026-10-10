import type { InboundEnvelope, InboundMatchConfig } from "../providers/types.js";
export declare function matchesInbound(envelope: InboundEnvelope, config: InboundMatchConfig, nonce: string, options?: {
    requireAcknowledgement?: boolean;
}): boolean;
