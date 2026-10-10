import { ADMIN_TOKEN_HEADER } from "../servers/http.js";
export const DEFAULT_ACCOUNT_ID = "default";
export const OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH = "crabline-channel-driver-capabilities.json";
export const OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH = "crabline-provider-readiness.json";
export const OPENCLAW_CRABLINE_MANIFEST_PATH = "crabline-provider-server.json";
export const OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY = ".crabline-channel-driver-artifacts";
export const OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH = `${OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY}/current.json`;
export const OPENCLAW_CRABLINE_DEFAULT_CHANNEL = "telegram";
const OPENCLAW_CRABLINE_PROVIDER_PROBE_TIMEOUT_MS = 5_000;
const OPENCLAW_CRABLINE_PROVIDER_PROBE_ABORT_GRACE_MS = 250;
const OPENCLAW_CRABLINE_PROVIDER_PROBE_LABELS = {
    discord: "Discord users/@me",
    mattermost: "Mattermost users.me",
    matrix: "Matrix whoami",
    signal: "Signal check",
    slack: "Slack auth.test",
    telegram: "Telegram getMe",
    whatsapp: "WhatsApp phone number",
    zalo: "Zalo getMe",
};
const unsettledProviderProbeSettlements = new WeakMap();
export function parseQaDeliveryTarget(params) {
    const parsed = parseQaTarget(params.target);
    const threadId = params.threadId?.trim();
    if (parsed.threadId && threadId && parsed.threadId !== threadId) {
        throw new Error("OpenClaw Crabline delivery received conflicting thread targets.");
    }
    return threadId ? { ...parsed, threadId } : parsed;
}
export function createProviderIdRegistry(params) {
    const idByLogicalKey = new Map();
    const ownerById = new Map();
    return {
        resolveLogical(logicalKey) {
            const existingId = idByLogicalKey.get(logicalKey);
            if (existingId) {
                return existingId;
            }
            const candidate = params.candidate(logicalKey);
            const owner = ownerById.get(candidate);
            if (owner && owner !== `logical:${logicalKey}`) {
                throw new Error(`${params.conflictLabel} conflicts with another provider identity.`);
            }
            idByLogicalKey.set(logicalKey, candidate);
            ownerById.set(candidate, `logical:${logicalKey}`);
            return candidate;
        },
        reserveNative(nativeId) {
            const owner = ownerById.get(nativeId);
            if (owner?.startsWith("logical:")) {
                throw new Error(`${params.conflictLabel} native id conflicts with a logical identity.`);
            }
            ownerById.set(nativeId, `native:${nativeId}`);
            return nativeId;
        },
    };
}
export function createOpenClawCrablineProviderBridge(params) {
    const createAdapter = (manifest) => {
        const adapter = params.createAdapter(manifest);
        return {
            createAgentDelivery(parsed) {
                return adapter.createAgentDelivery(parsed);
            },
            createBinding() {
                return adapter.createBinding();
            },
            createInbound(input) {
                if (!readNonBlankString(input.text) &&
                    !(params.allowAttachmentOnlyInbound && input.attachments?.length)) {
                    throw new Error("OpenClaw Crabline inbound message text is required.");
                }
                if (input.conversation.kind !== "direct" && input.conversation.kind !== "group") {
                    throw new Error("OpenClaw Crabline inbound conversation kind must be direct or group.");
                }
                return adapter.createInbound(input);
            },
            createOutboundObservation(outboundParams) {
                return adapter.createOutboundObservation(outboundParams);
            },
            probe(signal) {
                return adapter.probe(signal);
            },
            ...(adapter.resolveInboundProviderTargetKey
                ? {
                    resolveInboundProviderTargetKey: adapter.resolveInboundProviderTargetKey.bind(adapter),
                }
                : {}),
        };
    };
    const bridge = {
        createAdapter,
        createAdapterFromManifest(manifest) {
            if (manifest.provider !== params.provider) {
                throw new Error(`Unsupported OpenClaw provider binding: expected ${params.provider}, got ${manifest.provider}.`);
            }
            return createAdapter(manifest);
        },
        provider: params.provider,
    };
    return bridge;
}
export function correlateOpenClawCrablineOutboundObservation(params) {
    const to = params.observation.providerTargetKeys
        .map((key) => params.targetByProviderTarget.get(key))
        .find((target) => target !== undefined) ?? params.observation.fallbackTarget;
    if (!to) {
        return null;
    }
    const { fallbackTarget: _fallbackTarget, providerTargetKeys: _providerTargetKeys, ...message } = params.observation;
    return { ...message, to };
}
export async function runOpenClawCrablineProviderProbe(provider, probe) {
    const signal = AbortSignal.timeout(OPENCLAW_CRABLINE_PROVIDER_PROBE_TIMEOUT_MS);
    const timeoutError = (cause) => new Error(`Crabline ${OPENCLAW_CRABLINE_PROVIDER_PROBE_LABELS[provider]} probe timed out after ${OPENCLAW_CRABLINE_PROVIDER_PROBE_TIMEOUT_MS} ms.`, { cause });
    const operation = Promise.resolve().then(() => probe(signal));
    const settled = operation.then(() => undefined, () => undefined);
    let onAbort;
    const timeout = new Promise((resolve) => {
        onAbort = () => resolve({ kind: "timeout" });
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
    });
    try {
        const outcome = await Promise.race([
            operation.then((value) => ({ kind: "result", value }), (error) => ({ error, kind: "error" })),
            timeout,
        ]);
        if (outcome.kind === "result") {
            return outcome.value;
        }
        if (outcome.kind === "error" && !signal.aborted) {
            throw outcome.error;
        }
        const failure = timeoutError(outcome.kind === "error" ? outcome.error : signal.reason);
        let abortGrace;
        const drained = await Promise.race([
            settled.then(() => true),
            new Promise((resolve) => {
                abortGrace = setTimeout(() => resolve(false), OPENCLAW_CRABLINE_PROVIDER_PROBE_ABORT_GRACE_MS);
            }),
        ]);
        if (abortGrace) {
            clearTimeout(abortGrace);
        }
        if (!drained) {
            unsettledProviderProbeSettlements.set(failure, settled);
        }
        throw failure;
    }
    finally {
        if (onAbort) {
            signal.removeEventListener("abort", onAbort);
        }
    }
}
export function getUnsettledOpenClawCrablineProviderProbe(error) {
    return error instanceof Error ? unsettledProviderProbeSettlements.get(error) : undefined;
}
export function readString(value) {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }
    if (typeof value === "number" || typeof value === "bigint") {
        return String(value);
    }
    return undefined;
}
export function readNonBlankString(value) {
    return typeof value === "string" && value.trim() ? value : undefined;
}
export function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function readInteger(value) {
    const stringValue = readString(value);
    if (!stringValue || !/^-?\d+$/u.test(stringValue)) {
        return undefined;
    }
    const parsed = Number(stringValue);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}
export function parseQaTarget(target) {
    const trimmed = target.trim();
    const invalidTarget = () => {
        throw new Error("OpenClaw Crabline target must be a non-blank native id or a valid dm:<id>, group:<id>, channel:<id>, or thread:<id>/<thread-id> target.");
    };
    if (!trimmed) {
        return invalidTarget();
    }
    if (trimmed.startsWith("thread:")) {
        const encoded = trimmed.startsWith("thread:/v1/");
        const rest = trimmed.slice(encoded ? "thread:/v1/".length : "thread:".length);
        const components = rest.split("/");
        const explicitKind = encoded && components.length === 3 && (components[0] === "dm" || components[0] === "group")
            ? components.shift()
            : undefined;
        if (components.length !== 2) {
            return invalidTarget();
        }
        let id = components[0].trim();
        let threadId = components[1].trim();
        if (encoded) {
            try {
                id = decodeURIComponent(id).trim();
                threadId = decodeURIComponent(threadId).trim();
            }
            catch {
                return invalidTarget();
            }
        }
        if (!id || !threadId) {
            return invalidTarget();
        }
        return {
            kind: explicitKind === "dm" ? "direct" : "group",
            id,
            native: false,
            threadId,
        };
    }
    if (trimmed.startsWith("channel:")) {
        const id = trimmed.slice("channel:".length).trim();
        return id ? { kind: "group", id, native: true } : invalidTarget();
    }
    if (trimmed.startsWith("group:")) {
        const id = trimmed.slice("group:".length).trim();
        return id ? { kind: "group", id, native: false } : invalidTarget();
    }
    if (trimmed.startsWith("dm:")) {
        const id = trimmed.slice("dm:".length).trim();
        return id ? { kind: "direct", id, native: false } : invalidTarget();
    }
    if (/^(?:dm|group|channel|thread)(?=\s*:|$)/iu.test(trimmed)) {
        return invalidTarget();
    }
    return { kind: "direct", id: trimmed, native: true };
}
export function canonicalConversationIdForInbound(input) {
    const conversationId = readNonBlankString(input.conversation.id);
    if (!conversationId) {
        throw new Error("OpenClaw Crabline inbound conversation id is required.");
    }
    return conversationId.trim();
}
function encodeQaThreadComponent(value) {
    return value.replaceAll("%", "%25").replaceAll("/", "%2F");
}
export function qaTargetForInbound(input) {
    const conversationId = canonicalConversationIdForInbound(input);
    const threadId = input.threadId?.trim();
    const prefix = input.conversation.kind === "direct" ? "dm" : "group";
    return threadId
        ? `thread:/v1/${input.conversation.kind === "direct" ? "dm/" : ""}${encodeQaThreadComponent(conversationId)}/${encodeQaThreadComponent(threadId)}`
        : `${prefix}:${conversationId}`;
}
export function createAdminInboundRequest(manifest) {
    return {
        providerHeaders: {
            "content-type": "application/json",
            [ADMIN_TOKEN_HEADER]: manifest.adminToken,
        },
        providerUrl: manifest.endpoints.adminInboundUrl,
    };
}
//# sourceMappingURL=shared.js.map