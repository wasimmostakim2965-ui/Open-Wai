import { randomUUID } from "node:crypto";
import { CRABLINE_SERVER_CHANNELS, isCrablineServerChannel, startCrablineServer, } from "./servers/index.js";
import { SLACK_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/slack.js";
import { DISCORD_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/discord.js";
import { MATTERMOST_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/mattermost.js";
import { MATRIX_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/matrix.js";
import { SIGNAL_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/signal.js";
import { TELEGRAM_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/telegram.js";
import { WHATSAPP_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/whatsapp.js";
import { ZALO_OPENCLAW_CRABLINE_PROVIDER_BRIDGE } from "./openclaw/bridges/zalo.js";
import { OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH, OPENCLAW_CRABLINE_DEFAULT_CHANNEL, OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, OPENCLAW_CRABLINE_MANIFEST_PATH, getUnsettledOpenClawCrablineProviderProbe, isRecord, parseQaDeliveryTarget, runOpenClawCrablineProviderProbe, correlateOpenClawCrablineOutboundObservation, } from "./openclaw/shared.js";
import { publishOpenClawCrablineArtifactGeneration } from "./openclaw/artifact-generation.js";
import { isAcceptedOpenClawCrablineOutbound } from "./openclaw/outbound-contract.js";
import { securePrivateDirectory, syncParentDirectory, } from "./openclaw/private-file.js";
import { acquireOpenClawCrablineProviderReadinessLock, releaseOpenClawCrablineProviderReadinessLock, } from "./openclaw/provider-readiness-lock.js";
import fs from "node:fs/promises";
import path from "node:path";
import { withServerRecorderSnapshot } from "./servers/recorder.js";
export { OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH, OPENCLAW_CRABLINE_DEFAULT_CHANNEL, OPENCLAW_CRABLINE_MANIFEST_PATH, };
const OPENCLAW_CRABLINE_PROVIDER_BRIDGES = {
    discord: DISCORD_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    mattermost: MATTERMOST_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    matrix: MATRIX_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    signal: SIGNAL_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    slack: SLACK_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    telegram: TELEGRAM_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    whatsapp: WHATSAPP_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
    zalo: ZALO_OPENCLAW_CRABLINE_PROVIDER_BRIDGE,
};
const OPENCLAW_CRABLINE_PROVIDER_BRIDGE_LIST = Object.values(OPENCLAW_CRABLINE_PROVIDER_BRIDGES);
const RECORDER_TEMP_NAME_PATTERN = /^\.([a-z]+)-provider-server\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl\.tmp$/iu;
const RECORDER_LOCK_REMOVAL_TOMBSTONE_PATTERN = /^\.(.+)\.\d+\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.remove$/iu;
const OPENCLAW_CRABLINE_PROVIDER_PROBE_CLEANUP_GRACE_MS = 250;
function isOpenClawCrablineRecorderTemporary(name) {
    const channel = RECORDER_TEMP_NAME_PATTERN.exec(name)?.[1]?.toLowerCase();
    return channel !== undefined && isCrablineServerChannel(channel);
}
function hasStringRecordValues(value) {
    return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}
function isOpenClawCrablineRecorderEvent(value) {
    return (isRecord(value) &&
        typeof value.at === "string" &&
        Number.isFinite(Date.parse(value.at)) &&
        typeof value.method === "string" &&
        value.method.length > 0 &&
        typeof value.path === "string" &&
        value.path.startsWith("/") &&
        hasStringRecordValues(value.query) &&
        ((value.type === "api" && typeof value.accepted === "boolean") ||
            (value.type === "admin" &&
                (value.accepted === undefined || typeof value.accepted === "boolean"))));
}
function openClawCrablineProviderProbeRequest(manifest) {
    switch (manifest.provider) {
        case "discord":
            return {
                method: "GET",
                path: new URL(`${manifest.endpoints.apiRoot}/v10/users/@me`).pathname,
            };
        case "mattermost":
            return {
                method: "GET",
                path: new URL(`${manifest.endpoints.apiRoot}/users/me`).pathname,
            };
        case "matrix":
            return {
                method: "GET",
                path: new URL(`${manifest.endpoints.clientApiRoot}/account/whoami`).pathname,
            };
        case "signal":
            return {
                method: "GET",
                path: new URL("/api/v1/check", manifest.baseUrl).pathname,
            };
        case "slack":
            return {
                method: "POST",
                path: new URL("auth.test", manifest.endpoints.apiRoot).pathname,
            };
        case "telegram":
            return { method: "GET", path: "/bot<redacted>/getMe" };
        case "whatsapp":
            return {
                method: "GET",
                path: new URL(manifest.endpoints.phoneNumberUrl).pathname,
            };
        case "zalo":
            return { method: "POST", path: "/bot<redacted>/getMe" };
    }
}
function assertOpenClawCrablineRecorderEvidence(contents, manifest) {
    const expectedRequest = openClawCrablineProviderProbeRequest(manifest);
    let recorderEvidence = false;
    for (const line of contents.split(/\r?\n/u)) {
        if (!line.trim()) {
            continue;
        }
        let event;
        try {
            event = JSON.parse(line);
        }
        catch (error) {
            throw new Error("OpenClaw Crabline provider probe produced no valid JSONL recorder evidence.", { cause: error });
        }
        if (!isOpenClawCrablineRecorderEvent(event)) {
            throw new Error("OpenClaw Crabline provider probe produced no valid JSONL recorder evidence.");
        }
        if (event.accepted &&
            event.type === "api" &&
            event.method === expectedRequest.method &&
            event.path === expectedRequest.path) {
            recorderEvidence = true;
        }
    }
    if (!recorderEvidence) {
        throw new Error("OpenClaw Crabline provider probe produced no valid JSONL recorder evidence.");
    }
}
function isOpenClawCrablineRecorderTemporaryLock(name) {
    return name.endsWith(".lock") && isOpenClawCrablineRecorderTemporary(name.slice(0, -5));
}
function openClawCrablineRecorderLockTombstoneBaseName(name) {
    const originalName = RECORDER_LOCK_REMOVAL_TOMBSTONE_PATTERN.exec(name)?.[1];
    return originalName !== undefined && isOpenClawCrablineRecorderTemporaryLock(originalName)
        ? originalName
        : null;
}
async function reclaimOpenClawCrablineRecorderTemporaryLock(directoryPath, name, lock, quarantineBaseName = name) {
    const lockPath = path.join(directoryPath, name);
    let identity;
    try {
        identity = await fs.lstat(lockPath, { bigint: true });
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return;
        }
        throw error;
    }
    if (!identity.isDirectory()) {
        return;
    }
    const currentUserId = process.geteuid?.();
    if (currentUserId !== undefined && identity.uid !== BigInt(currentUserId)) {
        return;
    }
    const quarantinePath = path.join(directoryPath, `.${quarantineBaseName}.${process.pid}.${randomUUID()}.remove`);
    await lock.assertOwned();
    try {
        await fs.rename(lockPath, quarantinePath);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return;
        }
        throw error;
    }
    const quarantined = await fs.lstat(quarantinePath, { bigint: true });
    if (!quarantined.isDirectory() ||
        quarantined.dev !== identity.dev ||
        quarantined.ino !== identity.ino) {
        throw new Error("OpenClaw Crabline recorder lock identity changed during recovery.");
    }
    await syncParentDirectory(quarantinePath);
    await fs.rm(quarantinePath, { force: true, recursive: true });
    await syncParentDirectory(quarantinePath);
}
async function reclaimOpenClawCrablineRecorderTemporaries(directory, lock) {
    const directoryPath = directory.directoryPath;
    await directory.assertIdentityAt();
    for (const entry of await fs.readdir(directoryPath, { withFileTypes: true })) {
        await directory.assertIdentityAt();
        const tombstoneBaseName = entry.isDirectory()
            ? openClawCrablineRecorderLockTombstoneBaseName(entry.name)
            : null;
        if (isOpenClawCrablineRecorderTemporaryLock(entry.name) || tombstoneBaseName !== null) {
            if (entry.isDirectory()) {
                await reclaimOpenClawCrablineRecorderTemporaryLock(directoryPath, entry.name, lock, tombstoneBaseName ?? entry.name);
            }
            continue;
        }
        if (!isOpenClawCrablineRecorderTemporary(entry.name) ||
            (!entry.isFile() && !entry.isSymbolicLink())) {
            continue;
        }
        await lock.assertOwned();
        const temporaryPath = path.join(directoryPath, entry.name);
        await fs.rm(temporaryPath, { force: true });
        await syncParentDirectory(temporaryPath);
        await directory.assertIdentityAt();
    }
    await directory.assertIdentityAt();
}
function assertOwnedRecorderStats(stats, expected) {
    const currentUserId = process.geteuid?.();
    if (!stats.isFile() ||
        stats.nlink !== 1n ||
        stats.ino <= 0n ||
        (currentUserId !== undefined && stats.uid !== BigInt(currentUserId)) ||
        (expected !== undefined &&
            (stats.dev !== expected.device ||
                stats.ino !== expected.inode ||
                stats.uid !== expected.userId))) {
        throw new Error("OpenClaw Crabline recorder snapshot identity is invalid.");
    }
    return {
        device: stats.dev,
        inode: stats.ino,
        userId: stats.uid,
    };
}
async function readOwnedRecorderSnapshot(recorderPath, directory) {
    await directory.assertIdentityAt();
    const handle = await fs.open(recorderPath, "r");
    try {
        const identity = assertOwnedRecorderStats(await handle.stat({ bigint: true }));
        assertOwnedRecorderStats(await fs.lstat(recorderPath, { bigint: true }), identity);
        const contents = await handle.readFile("utf8");
        await directory.assertIdentityAt();
        assertOwnedRecorderStats(await fs.lstat(recorderPath, { bigint: true }), identity);
        return { contents, identity };
    }
    finally {
        await handle.close();
    }
}
async function removeOwnedRecorderTemporary(params) {
    await params.directory.assertIdentityAt();
    let stats;
    try {
        stats = await fs.lstat(params.recorderPath, { bigint: true });
    }
    catch (error) {
        if (error.code === "ENOENT") {
            await params.syncParent(params.recorderPath);
            return;
        }
        throw error;
    }
    assertOwnedRecorderStats(stats, params.identity);
    await fs.rm(params.recorderPath);
    await params.directory.assertIdentityAt();
    await params.syncParent(params.recorderPath);
}
function createOpenClawCrablineProviderAdapter(manifest) {
    const bridge = OPENCLAW_CRABLINE_PROVIDER_BRIDGE_LIST.find((candidate) => candidate.provider === manifest.provider);
    if (bridge) {
        const adapter = bridge.createAdapterFromManifest(manifest);
        return {
            ...adapter,
            createOutboundObservation: (params) => isAcceptedOpenClawCrablineOutbound({
                event: params.event,
                manifest,
            })
                ? adapter.createOutboundObservation(params)
                : null,
            probe: () => runOpenClawCrablineProviderProbe(manifest.provider, (signal) => adapter.probe(signal)),
        };
    }
    throw new Error("Unsupported OpenClaw provider binding.");
}
export function resolveOpenClawCrablineChannel(input) {
    const channel = input === undefined || input === null
        ? OPENCLAW_CRABLINE_DEFAULT_CHANNEL
        : input.trim().toLowerCase();
    if (isCrablineServerChannel(channel)) {
        return channel;
    }
    throw new Error(`--channel must be one of ${CRABLINE_SERVER_CHANNELS.join(", ")} for --channel-driver crabline, got "${input}".`);
}
export function resolveOpenClawCrablineChannelDriverSelection(params) {
    return {
        channel: resolveOpenClawCrablineChannel(params.channel),
        channelDriver: "crabline",
        capabilityMatrixPath: OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH,
        providerReadinessArtifactPath: OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH,
    };
}
export async function probeOpenClawCrablineProvider(manifest) {
    return await createOpenClawCrablineProviderAdapter(manifest).probe();
}
export function createOpenClawCrablineProviderBinding(manifest) {
    return createOpenClawCrablineProviderAdapter(manifest).createBinding();
}
export function createOpenClawCrablineAgentDelivery(params) {
    return createOpenClawCrablineProviderAdapter(params.manifest).createAgentDelivery(parseQaDeliveryTarget(params));
}
export function createOpenClawCrablineInbound(params) {
    return createOpenClawCrablineProviderAdapter(params.manifest).createInbound(params.input);
}
/** @deprecated Use createOpenClawCrablineOutboundObservation and correlate in the consumer. */
export function createOpenClawCrablineOutboundFromRecorderEvent(params) {
    const observation = createOpenClawCrablineOutboundObservation({
        event: params.event,
        manifest: params.manifest,
    });
    return observation
        ? correlateOpenClawCrablineOutboundObservation({
            observation,
            targetByProviderTarget: params.targetByProviderTarget,
        })
        : null;
}
export function createOpenClawCrablineOutboundObservation(params) {
    return createOpenClawCrablineProviderAdapter(params.manifest).createOutboundObservation({
        event: params.event,
    });
}
export async function startOpenClawCrablineAdapter(params, dependencies = {}) {
    const server = await (dependencies.startServer ?? startCrablineServer)({
        channel: params.channel,
        onEvent: params.onEvent,
        recorderPath: params.recorderPath,
    });
    try {
        const providerAdapter = (dependencies.createProviderAdapter ?? createOpenClawCrablineProviderAdapter)(server.manifest);
        const binding = providerAdapter.createBinding();
        return {
            ...binding,
            close: server.close,
            createGatewayConfig: (openclawConfig = params.openclawConfig ?? {}) => binding.createGatewayConfig(openclawConfig),
            createAgentDelivery: ({ target, threadId }) => providerAdapter.createAgentDelivery(parseQaDeliveryTarget({ target, threadId })),
            createInbound: ({ input }) => providerAdapter.createInbound(input),
            createOutboundObservation: ({ event }) => providerAdapter.createOutboundObservation({ event }),
            createOutboundFromRecorderEvent: ({ event, targetByProviderTarget }) => {
                const observation = providerAdapter.createOutboundObservation({ event });
                return observation
                    ? correlateOpenClawCrablineOutboundObservation({
                        observation,
                        targetByProviderTarget,
                    })
                    : null;
            },
            manifest: server.manifest,
            probe: () => providerAdapter.probe(),
            resolveInboundProviderTargetKey: ({ inbound, response }) => providerAdapter.resolveInboundProviderTargetKey?.({ inbound, response }) ??
                inbound.providerTargetKey,
        };
    }
    catch (error) {
        try {
            await server.close();
        }
        catch (closeError) {
            const aggregateError = new AggregateError([error, closeError], "OpenClaw Crabline adapter startup failed.");
            aggregateError.cause = error;
            throw aggregateError;
        }
        throw error;
    }
}
function attachOpenClawCrablineProbeCleanupFailure(probeFailure, cleanupError) {
    const existingCause = probeFailure.cause;
    try {
        Object.defineProperty(probeFailure, "cause", {
            configurable: true,
            value: existingCause === undefined
                ? cleanupError
                : new AggregateError([existingCause, cleanupError], "OpenClaw Crabline provider probe cleanup also failed."),
        });
    }
    catch {
        // Some provider errors are frozen; preserving the primary failure is authoritative.
    }
}
async function waitForOpenClawCrablineProbeCleanup(probeSettlement) {
    let timeout;
    try {
        await Promise.race([
            probeSettlement,
            new Promise((resolve) => {
                timeout = setTimeout(resolve, OPENCLAW_CRABLINE_PROVIDER_PROBE_CLEANUP_GRACE_MS);
            }),
        ]);
    }
    finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
}
export async function runOpenClawCrablineProviderReadiness(params, dependencies = {}) {
    const outputDir = path.resolve(params.outputDir);
    const releaseLock = dependencies.releaseLock ?? releaseOpenClawCrablineProviderReadinessLock;
    const syncRecorderParent = dependencies.syncParent ?? syncParentDirectory;
    const providerReadinessLock = await (dependencies.acquireLock ?? acquireOpenClawCrablineProviderReadinessLock)({
        channel: params.selection.channel,
        outputDir,
    });
    let outcome;
    let recorderDirectory;
    let recorderIdentity;
    let recorderPath;
    try {
        const artifactsDirectory = await securePrivateDirectory(path.join(outputDir, "artifacts"));
        recorderDirectory = await securePrivateDirectory(path.join(artifactsDirectory.directoryPath, "crabline"));
        await artifactsDirectory.assertIdentityAt();
        await recorderDirectory.assertIdentityAt();
        await reclaimOpenClawCrablineRecorderTemporaries(recorderDirectory, providerReadinessLock);
        const providedAdapter = params.adapter;
        if (providedAdapter) {
            if (providedAdapter.channel !== params.selection.channel) {
                throw new Error(`OpenClaw Crabline readiness adapter channel "${providedAdapter.channel}" does not match selection "${params.selection.channel}".`);
            }
            const expectedRecorderPath = path.join(recorderDirectory.directoryPath, `${params.selection.channel}-provider-server.jsonl`);
            if (path.resolve(providedAdapter.manifest.recorderPath) !== expectedRecorderPath) {
                throw new Error("OpenClaw Crabline readiness adapter recorder must be the canonical output artifact.");
            }
            recorderPath = expectedRecorderPath;
        }
        else {
            recorderPath = path.join(recorderDirectory.directoryPath, `.${params.selection.channel}-provider-server.${randomUUID()}.jsonl.tmp`);
        }
        const adapter = providedAdapter ??
            (await (dependencies.startAdapter ?? startOpenClawCrablineAdapter)({
                channel: params.selection.channel,
                openclawConfig: {},
                recorderPath,
            }));
        let probe;
        let probeFailed = false;
        let probeFailure;
        let probeSettlement;
        try {
            probe = await adapter.probe();
        }
        catch (error) {
            probeFailed = true;
            probeFailure = error;
            probeSettlement = getUnsettledOpenClawCrablineProviderProbe(error);
        }
        if (probeSettlement) {
            await waitForOpenClawCrablineProbeCleanup(probeSettlement);
        }
        if (!providedAdapter && probeSettlement) {
            try {
                await adapter.close();
            }
            catch (cleanupError) {
                if (probeFailure instanceof Error) {
                    attachOpenClawCrablineProbeCleanupFailure(probeFailure, cleanupError);
                }
                else {
                    const combinedError = new Error("OpenClaw Crabline provider probe and cleanup both failed.", { cause: cleanupError });
                    Object.defineProperty(combinedError, "errors", {
                        value: [probeFailure, cleanupError],
                    });
                    throw combinedError;
                }
            }
        }
        else if (!providedAdapter) {
            try {
                await adapter.close();
            }
            catch (cleanupError) {
                if (!probeFailed) {
                    throw cleanupError;
                }
                if (probeFailure instanceof Error) {
                    attachOpenClawCrablineProbeCleanupFailure(probeFailure, cleanupError);
                    throw probeFailure;
                }
                const combinedError = new Error("OpenClaw Crabline provider probe and cleanup both failed.", {
                    cause: cleanupError,
                });
                Object.defineProperty(combinedError, "errors", {
                    value: [probeFailure, cleanupError],
                });
                throw combinedError;
            }
        }
        if (probeFailed) {
            throw probeFailure;
        }
        if (!recorderPath || !recorderDirectory) {
            throw new Error("OpenClaw Crabline recorder was not initialized.");
        }
        const snapshotRecorderPath = recorderPath;
        const snapshotRecorderDirectory = recorderDirectory;
        const readRecorderSnapshot = async () => await readOwnedRecorderSnapshot(snapshotRecorderPath, snapshotRecorderDirectory);
        const recorderSnapshot = providedAdapter
            ? await withServerRecorderSnapshot({
                read: readRecorderSnapshot,
                recorderPath: snapshotRecorderPath,
            })
            : await readRecorderSnapshot();
        recorderIdentity = recorderSnapshot.identity;
        const recorderSnapshotContents = recorderSnapshot.contents;
        assertOpenClawCrablineRecorderEvidence(recorderSnapshotContents, adapter.manifest);
        const capabilityReport = {
            result: {
                driver: "crabline",
                selectedChannel: params.selection.channel,
                supportedChannels: [...CRABLINE_SERVER_CHANNELS],
            },
        };
        const providerReadiness = {
            result: {
                ok: true,
                proof: "provider-api-probe",
                ready: true,
                probe,
                provider: adapter.manifest.provider,
                endpoints: adapter.manifest.endpoints,
                recorderPath: path.relative(outputDir, adapter.manifest.recorderPath),
            },
        };
        const generation = await (dependencies.publishGeneration ?? publishOpenClawCrablineArtifactGeneration)({
            capabilityReport,
            lock: providerReadinessLock,
            manifest: adapter.manifest,
            outputDir,
            recorderSnapshot: {
                contents: recorderSnapshotContents,
                fileName: `${params.selection.channel}-provider-server.jsonl`,
            },
            selection: params.selection,
            providerReadiness,
        });
        let recorderCleanupWarning;
        if (!providedAdapter) {
            try {
                await removeOwnedRecorderTemporary({
                    directory: recorderDirectory,
                    identity: recorderIdentity,
                    recorderPath,
                    syncParent: syncRecorderParent,
                });
                recorderPath = undefined;
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                recorderCleanupWarning = `OpenClaw Crabline recorder snapshot committed but temporary cleanup failed: ${detail}`;
            }
        }
        outcome = {
            committed: true,
            result: {
                artifactPointerPath: generation.pointerPath,
                capabilityReport,
                capabilityMatrixPath: generation.capabilityMatrixPath,
                generation: generation.generation,
                manifestPath: generation.manifestPath,
                providerReadiness: generation.providerReadiness,
                providerReadinessArtifactPath: generation.providerReadinessArtifactPath,
                ...(generation.warnings || recorderCleanupWarning
                    ? {
                        warnings: [
                            ...(generation.warnings ?? []),
                            ...(recorderCleanupWarning ? [recorderCleanupWarning] : []),
                        ],
                    }
                    : {}),
            },
        };
    }
    catch (error) {
        let primaryError = error;
        if (!params.adapter && recorderPath && recorderDirectory) {
            try {
                await removeOwnedRecorderTemporary({
                    directory: recorderDirectory,
                    ...(recorderIdentity ? { identity: recorderIdentity } : {}),
                    recorderPath,
                    syncParent: syncRecorderParent,
                });
                recorderPath = undefined;
            }
            catch (cleanupError) {
                if (primaryError instanceof Error) {
                    const existingCause = primaryError.cause;
                    try {
                        Object.defineProperty(primaryError, "cause", {
                            configurable: true,
                            value: existingCause === undefined
                                ? cleanupError
                                : new AggregateError([existingCause, cleanupError], "OpenClaw Crabline readiness failure cleanup also failed."),
                        });
                    }
                    catch {
                        // Frozen failures remain authoritative even if temporary cleanup also fails.
                    }
                }
                else {
                    const combinedError = new Error("OpenClaw Crabline readiness and temporary cleanup both failed.", { cause: cleanupError });
                    Object.defineProperty(combinedError, "errors", {
                        value: [primaryError, cleanupError],
                    });
                    primaryError = combinedError;
                }
            }
        }
        outcome = { committed: false, error: primaryError };
    }
    try {
        await releaseLock(providerReadinessLock);
    }
    catch (cleanupError) {
        // The pointer switch is authoritative; lock removal cannot roll it back.
        if (!outcome.committed) {
            if (outcome.error instanceof Error) {
                const existingCause = outcome.error.cause;
                try {
                    Object.defineProperty(outcome.error, "cause", {
                        configurable: true,
                        value: existingCause === undefined
                            ? cleanupError
                            : new AggregateError([existingCause, cleanupError], "OpenClaw Crabline provider readiness failure cleanup also failed."),
                    });
                }
                catch {
                    // Some failures are frozen; preserving the primary error is authoritative.
                }
                throw outcome.error;
            }
            const combinedError = new Error("OpenClaw Crabline provider readiness and lock cleanup both failed.", {
                cause: cleanupError,
            });
            Object.defineProperty(combinedError, "errors", {
                value: [outcome.error, cleanupError],
            });
            throw combinedError;
        }
        const detail = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        outcome.result = {
            ...outcome.result,
            warnings: [
                ...(outcome.result.warnings ?? []),
                `OpenClaw Crabline provider readiness committed but lock cleanup failed: ${detail}`,
            ],
        };
    }
    if (!outcome.committed) {
        throw outcome.error;
    }
    return outcome.result;
}
export function createOpenClawCrablineChannelReportNotes(selection) {
    if (!selection) {
        return [];
    }
    return [
        `Channel driver: ${selection.channelDriver} local provider for ${selection.channel}.`,
        `Channel artifact pointer: ${OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH}.`,
        `Generation capability filename: ${selection.capabilityMatrixPath}.`,
        `Generation provider-readiness filename: ${selection.providerReadinessArtifactPath}.`,
        "Crabline verifies the local provider API is ready; OpenClaw channel behavior is proven separately by QA scenarios that run the real channel adapter.",
    ];
}
//# sourceMappingURL=openclaw.js.map