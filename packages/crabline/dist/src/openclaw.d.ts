import { type CrablineServerChannel, type CrablineServerManifest, type StartCrablineServerParams, type StartedCrablineServer } from "./servers/index.js";
import { OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH, OPENCLAW_CRABLINE_DEFAULT_CHANNEL, OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, OPENCLAW_CRABLINE_MANIFEST_PATH, type OpenClawCrablineChannelDriverSelection, type OpenClawCrablineCorrelatedAgentDelivery, type OpenClawCrablineProviderReadinessResult, type OpenClawCrablineGatewayBinding, type OpenClawCrablineInbound, type OpenClawCrablineInboundInput, type OpenClawCrablineOutboundMessage, type OpenClawCrablineOutboundObservation, type OpenClawCrablineProviderAdapter, type StartedOpenClawCrablineAdapter, type StartedOpenClawCrablineCorrelatedAdapter, type StartOpenClawCrablineAdapterParams } from "./openclaw/shared.js";
export { OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH, OPENCLAW_CRABLINE_DEFAULT_CHANNEL, OPENCLAW_CRABLINE_MANIFEST_PATH, };
export type { OpenClawCrablineAgentDelivery, OpenClawCrablineChannelDriverSelection, OpenClawCrablineCorrelatedAgentDelivery, OpenClawCrablineProviderReadinessResult, OpenClawCrablineConversation, OpenClawCrablineGatewayBinding, OpenClawCrablineInbound, OpenClawCrablineInboundInput, OpenClawCrablineOutboundMessage, OpenClawCrablineOutboundObservation, StartedOpenClawCrablineAdapter, StartedOpenClawCrablineCorrelatedAdapter, StartOpenClawCrablineAdapterParams, } from "./openclaw/shared.js";
declare function createOpenClawCrablineProviderAdapter(manifest: CrablineServerManifest): OpenClawCrablineProviderAdapter;
export declare function resolveOpenClawCrablineChannel(input?: string | null): CrablineServerChannel;
export declare function resolveOpenClawCrablineChannelDriverSelection(params: {
    channel?: string | null;
}): OpenClawCrablineChannelDriverSelection & {
    providerReadinessArtifactPath: typeof OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH;
};
export declare function probeOpenClawCrablineProvider(manifest: CrablineServerManifest): Promise<unknown>;
export declare function createOpenClawCrablineProviderBinding(manifest: CrablineServerManifest): OpenClawCrablineGatewayBinding;
export declare function createOpenClawCrablineAgentDelivery(params: {
    manifest: CrablineServerManifest;
    target: string;
    threadId?: string | undefined;
}): OpenClawCrablineCorrelatedAgentDelivery;
export declare function createOpenClawCrablineInbound(params: {
    input: OpenClawCrablineInboundInput;
    manifest: CrablineServerManifest;
}): OpenClawCrablineInbound;
/** @deprecated Use createOpenClawCrablineOutboundObservation and correlate in the consumer. */
export declare function createOpenClawCrablineOutboundFromRecorderEvent(params: {
    event: unknown;
    manifest: CrablineServerManifest;
    targetByProviderTarget: ReadonlyMap<string, string>;
}): OpenClawCrablineOutboundMessage | null;
export declare function createOpenClawCrablineOutboundObservation(params: {
    event: unknown;
    manifest: CrablineServerManifest;
}): OpenClawCrablineOutboundObservation | null;
export declare function startOpenClawCrablineAdapter(params: StartOpenClawCrablineAdapterParams, dependencies?: {
    createProviderAdapter?: typeof createOpenClawCrablineProviderAdapter;
    startServer?: (params: StartCrablineServerParams) => Promise<StartedCrablineServer>;
}): Promise<StartedOpenClawCrablineCorrelatedAdapter>;
export declare function runOpenClawCrablineProviderReadiness(params: {
    /** Caller-owned running adapter. It remains open and its canonical recorder is snapshotted. */
    adapter?: StartedOpenClawCrablineAdapter;
    outputDir: string;
    selection: OpenClawCrablineChannelDriverSelection;
}): Promise<OpenClawCrablineProviderReadinessResult>;
export declare function createOpenClawCrablineChannelReportNotes(selection: OpenClawCrablineChannelDriverSelection | null | undefined): string[];
