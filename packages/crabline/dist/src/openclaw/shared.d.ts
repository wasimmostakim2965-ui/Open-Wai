import type { CrablineServerChannel, CrablineServerManifest } from "../servers/index.js";
import type { ServerEventObserver } from "../servers/recorder.js";
export declare const DEFAULT_ACCOUNT_ID = "default";
export declare const OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH = "crabline-channel-driver-capabilities.json";
export declare const OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH = "crabline-provider-readiness.json";
export declare const OPENCLAW_CRABLINE_MANIFEST_PATH = "crabline-provider-server.json";
export declare const OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY = ".crabline-channel-driver-artifacts";
export declare const OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH = ".crabline-channel-driver-artifacts/current.json";
export declare const OPENCLAW_CRABLINE_DEFAULT_CHANNEL = "telegram";
export type OpenClawCrablineChannelDriverSelection = {
    channel: CrablineServerChannel;
    channelDriver: "crabline";
    capabilityMatrixPath: typeof OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH;
    providerReadinessArtifactPath: typeof OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH;
};
export type OpenClawCrablineProviderReadinessResult = {
    artifactPointerPath: string;
    capabilityReport: unknown;
    capabilityMatrixPath: string;
    generation: string;
    manifestPath: string;
    providerReadiness: unknown;
    providerReadinessArtifactPath: string;
    warnings?: string[];
};
export type OpenClawCrablineConversation = {
    id: string;
    kind: "direct" | "group";
};
export type OpenClawCrablineInboundAttachment = {
    contentBase64?: string | undefined;
    fileName?: string | undefined;
    id: string;
    kind: "image" | "video" | "audio" | "file";
    mimeType: string;
};
export type OpenClawCrablineGatewayBinding = {
    accountId: string;
    channel: string;
    createProviderReadinessEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
    createGatewayConfig(openclawConfig?: Record<string, unknown>): Record<string, unknown>;
    requiredPluginIds: string[];
};
export type OpenClawCrablineAgentDelivery = {
    channel: string;
    replyChannel: string;
    replyTo: string;
    to: string;
};
export type OpenClawCrablineCorrelatedAgentDelivery = OpenClawCrablineAgentDelivery & {
    /** Adapter correlation key used to associate later provider recorder events with this target. */
    providerTargetKey: string;
};
export type OpenClawCrablineInboundInput = {
    attachments?: OpenClawCrablineInboundAttachment[] | undefined;
    conversation: {
        id: string;
        kind: "direct" | "group";
    };
    senderId: string;
    senderName?: string | undefined;
    text: string;
    threadId?: string | undefined;
    nativeCommand?: {
        name: string;
    } | undefined;
};
export type OpenClawCrablineInbound = {
    providerBody: Record<string, unknown>;
    providerHeaders: Record<string, string>;
    providerTargetKey: string;
    providerUrl: string;
    qaTarget: string;
    stateConversation: OpenClawCrablineConversation;
    threadId?: string | undefined;
};
export type OpenClawCrablineOutboundMessage = {
    accountId: string;
    senderId: string;
    senderName: string;
    text: string;
    to: string;
};
export type OpenClawCrablineOutboundObservation = Omit<OpenClawCrablineOutboundMessage, "to"> & {
    /** Provider-authoritative keys, in lookup priority order, for consumer correlation. */
    providerTargetKeys: readonly [string, ...string[]];
    /** Provider-native target used only when no consumer correlation exists. */
    fallbackTarget?: string | undefined;
};
export type StartOpenClawCrablineAdapterParams = {
    channel: CrablineServerChannel;
    onEvent?: ServerEventObserver | undefined;
    openclawConfig?: Record<string, unknown> | undefined;
    recorderPath?: string | undefined;
};
export type StartedOpenClawCrablineAdapter = OpenClawCrablineGatewayBinding & {
    close(): Promise<void>;
    createAgentDelivery(params: {
        target: string;
        threadId?: string | undefined;
    }): OpenClawCrablineAgentDelivery;
    createInbound(params: {
        input: OpenClawCrablineInboundInput;
    }): OpenClawCrablineInbound;
    createOutboundObservation(params: {
        event: unknown;
    }): OpenClawCrablineOutboundObservation | null;
    /** @deprecated Use createOutboundObservation and correlate providerTargetKeys in the consumer. */
    createOutboundFromRecorderEvent(params: {
        event: unknown;
        targetByProviderTarget: ReadonlyMap<string, string>;
    }): OpenClawCrablineOutboundMessage | null;
    manifest: CrablineServerManifest;
    probe(): Promise<unknown>;
};
export type StartedOpenClawCrablineCorrelatedAdapter = Omit<StartedOpenClawCrablineAdapter, "createAgentDelivery"> & {
    createAgentDelivery(params: {
        target: string;
        threadId?: string | undefined;
    }): OpenClawCrablineCorrelatedAgentDelivery;
    /** Resolves the provider-authoritative key from a successful inbound response. */
    resolveInboundProviderTargetKey(params: {
        inbound: OpenClawCrablineInbound;
        response: unknown;
    }): string;
};
export type ParsedQaTarget = {
    kind: "direct" | "group";
    id: string;
    native: boolean;
    threadId?: string;
};
export declare function parseQaDeliveryTarget(params: {
    target: string;
    threadId?: string | undefined;
}): ParsedQaTarget;
export declare function createProviderIdRegistry(params: {
    candidate(logicalKey: string): string;
    conflictLabel: string;
}): {
    resolveLogical(logicalKey: string): string;
    reserveNative(nativeId: string): string;
};
export type OpenClawCrablineProviderAdapter = {
    createAgentDelivery(parsed: ParsedQaTarget): OpenClawCrablineCorrelatedAgentDelivery;
    createBinding(): OpenClawCrablineGatewayBinding;
    createInbound(input: OpenClawCrablineInboundInput): OpenClawCrablineInbound;
    createOutboundObservation(params: {
        event: unknown;
    }): OpenClawCrablineOutboundObservation | null;
    probe(signal?: AbortSignal): Promise<unknown>;
    resolveInboundProviderTargetKey?(params: {
        inbound: OpenClawCrablineInbound;
        response: unknown;
    }): string;
};
export type OpenClawCrablineProviderBridge<TManifest extends CrablineServerManifest = CrablineServerManifest> = {
    createAdapter(manifest: TManifest): OpenClawCrablineProviderAdapter;
    createAdapterFromManifest(manifest: CrablineServerManifest): OpenClawCrablineProviderAdapter;
    provider: TManifest["provider"];
};
export type OpenClawCrablineProviderBridgeRegistry = {
    [Provider in CrablineServerManifest["provider"]]: OpenClawCrablineProviderBridge<Extract<CrablineServerManifest, {
        provider: Provider;
    }>>;
};
export declare function createOpenClawCrablineProviderBridge<TProvider extends CrablineServerManifest["provider"]>(params: {
    allowAttachmentOnlyInbound?: boolean;
    createAdapter(manifest: Extract<CrablineServerManifest, {
        provider: TProvider;
    }>): OpenClawCrablineProviderAdapter;
    provider: TProvider;
}): OpenClawCrablineProviderBridge<Extract<CrablineServerManifest, {
    provider: TProvider;
}>>;
export declare function correlateOpenClawCrablineOutboundObservation(params: {
    observation: OpenClawCrablineOutboundObservation;
    targetByProviderTarget: ReadonlyMap<string, string>;
}): OpenClawCrablineOutboundMessage | null;
export declare function runOpenClawCrablineProviderProbe<T>(provider: CrablineServerManifest["provider"], probe: (signal: AbortSignal) => Promise<T>): Promise<T>;
export declare function getUnsettledOpenClawCrablineProviderProbe(error: unknown): Promise<void> | undefined;
export declare function readString(value: unknown): string | undefined;
export declare function readNonBlankString(value: unknown): string | undefined;
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function readInteger(value: unknown): number | undefined;
export declare function parseQaTarget(target: string): ParsedQaTarget;
export declare function canonicalConversationIdForInbound(input: OpenClawCrablineInboundInput): string;
export declare function qaTargetForInbound(input: OpenClawCrablineInboundInput): string;
export declare function createAdminInboundRequest(manifest: CrablineServerManifest): {
    providerHeaders: {
        "content-type": string;
        "x-crabline-admin-token": string;
    };
    providerUrl: string;
};
