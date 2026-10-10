import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { captureDirectoryIdentity, publishPrivateFileAtomically, removeSecuredPrivateDirectory, securePrivateDirectory, syncParentDirectory, } from "./private-file.js";
import { OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH, OPENCLAW_CRABLINE_MANIFEST_PATH, } from "./shared.js";
const GENERATION_NAME_PATTERN = /^generation-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const STAGING_NAME_PATTERN = /^\.staging-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const REMOVAL_TOMBSTONE_PATTERN = /^\.(.+)\.\d+\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.remove$/iu;
const CURRENT_GENERATION_READ_ATTEMPTS = 8;
function resolveProviderReadinessArtifactPath(selection) {
    if (selection.capabilityMatrixPath !== OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH ||
        selection.providerReadinessArtifactPath !== OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH) {
        throw new Error("OpenClaw Crabline artifact selection paths are malformed.");
    }
    return selection.providerReadinessArtifactPath;
}
function isMissingPathError(error) {
    return error.code === "ENOENT";
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasNonEmptyStringFields(value, fields) {
    return fields.every((field) => typeof value[field] === "string" && value[field].length > 0);
}
function isGeneratedManifest(value) {
    if (value.version !== 1 ||
        !hasNonEmptyStringFields(value, ["adminToken", "baseUrl", "provider"]) ||
        !isRecord(value.endpoints) ||
        !isRecord(value.env)) {
        return false;
    }
    const endpoints = value.endpoints;
    const env = value.env;
    const baseUrl = value.baseUrl;
    switch (value.provider) {
        case "discord":
            return (hasNonEmptyStringFields(value, ["applicationId", "botToken", "botUserId"]) &&
                hasNonEmptyStringFields(endpoints, [
                    "adminInboundUrl",
                    "apiRoot",
                    "gatewayBotUrl",
                    "gatewayUrl",
                ]) &&
                hasNonEmptyStringFields(env, ["DISCORD_BOT_TOKEN"]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/discord/inbound` &&
                endpoints.apiRoot === `${baseUrl}/api` &&
                endpoints.gatewayBotUrl === `${baseUrl}/api/v10/gateway/bot` &&
                endpoints.gatewayUrl === `${baseUrl.replace(/^http/u, "ws")}/gateway` &&
                env.DISCORD_BOT_TOKEN === value.botToken);
        case "mattermost":
            return (hasNonEmptyStringFields(value, ["botToken", "botUserId"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "apiRoot", "websocketUrl"]) &&
                hasNonEmptyStringFields(env, ["MATTERMOST_BOT_TOKEN", "MATTERMOST_URL"]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/mattermost/inbound` &&
                endpoints.apiRoot === `${baseUrl}/api/v4` &&
                endpoints.websocketUrl === `${baseUrl.replace(/^http/u, "ws")}/api/v4/websocket` &&
                env.MATTERMOST_BOT_TOKEN === value.botToken &&
                env.MATTERMOST_URL === baseUrl);
        case "matrix":
            return (hasNonEmptyStringFields(value, ["accessToken", "botUserId", "deviceId"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "clientApiRoot", "syncUrl"]) &&
                hasNonEmptyStringFields(env, [
                    "MATRIX_ACCESS_TOKEN",
                    "MATRIX_BASE_URL",
                    "MATRIX_USER_ID",
                ]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/matrix/inbound` &&
                endpoints.clientApiRoot === `${baseUrl}/_matrix/client/v3` &&
                endpoints.syncUrl === `${endpoints.clientApiRoot}/sync` &&
                env.MATRIX_ACCESS_TOKEN === value.accessToken &&
                env.MATRIX_BASE_URL === baseUrl &&
                env.MATRIX_USER_ID === value.botUserId);
        case "signal":
            return (hasNonEmptyStringFields(value, ["account"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "apiRoot", "eventsUrl", "rpcUrl"]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/signal/inbound` &&
                endpoints.apiRoot === baseUrl &&
                endpoints.eventsUrl === `${baseUrl}/api/v1/events` &&
                endpoints.rpcUrl === `${baseUrl}/api/v1/rpc` &&
                Object.keys(env).length === 0);
        case "slack":
            return (hasNonEmptyStringFields(value, ["botToken", "signingSecret"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "apiRoot", "eventsUrl"]) &&
                hasNonEmptyStringFields(env, [
                    "SLACK_API_URL",
                    "SLACK_BOT_TOKEN",
                    "SLACK_SIGNING_SECRET",
                ]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/slack/inbound` &&
                endpoints.apiRoot === `${baseUrl}/api/` &&
                endpoints.eventsUrl === `${baseUrl}/slack/events` &&
                env.SLACK_API_URL === endpoints.apiRoot &&
                env.SLACK_BOT_TOKEN === value.botToken &&
                env.SLACK_SIGNING_SECRET === value.signingSecret);
        case "telegram":
            return (hasNonEmptyStringFields(value, ["botToken"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "apiRoot"]) &&
                hasNonEmptyStringFields(env, ["TELEGRAM_BOT_TOKEN"]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/telegram/inbound` &&
                endpoints.apiRoot === baseUrl &&
                env.TELEGRAM_BOT_TOKEN === value.botToken);
        case "whatsapp":
            return (hasNonEmptyStringFields(value, [
                "accessToken",
                "graphVersion",
                "phoneNumberId",
                "selfJid",
            ]) &&
                hasNonEmptyStringFields(endpoints, [
                    "adminInboundUrl",
                    "apiRoot",
                    "baileysWebSocketUrl",
                    "messagesUrl",
                    "phoneNumberUrl",
                ]) &&
                hasNonEmptyStringFields(env, [
                    "CLOUD_API_ACCESS_TOKEN",
                    "CLOUD_API_VERSION",
                    "WA_BASE_URL",
                    "WA_PHONE_NUMBER_ID",
                ]) &&
                endpoints.adminInboundUrl === `${baseUrl}/_crabline/admin/whatsapp/inbound` &&
                endpoints.apiRoot === `${baseUrl}/${value.graphVersion}` &&
                endpoints.phoneNumberUrl ===
                    `${endpoints.apiRoot}/${value.phoneNumberId}` &&
                endpoints.messagesUrl === `${endpoints.phoneNumberUrl}/messages` &&
                endpoints.baileysWebSocketUrl ===
                    `${baseUrl.replace(/^http/u, "ws")}/ws/chat?access_token=${encodeURIComponent(value.accessToken)}` &&
                env.CLOUD_API_ACCESS_TOKEN === value.accessToken &&
                env.CLOUD_API_VERSION === value.graphVersion &&
                env.WA_BASE_URL === baseUrl &&
                env.WA_PHONE_NUMBER_ID === value.phoneNumberId);
        case "zalo":
            return (hasNonEmptyStringFields(value, ["botId", "botToken"]) &&
                hasNonEmptyStringFields(endpoints, ["adminInboundUrl", "apiRoot"]) &&
                hasNonEmptyStringFields(env, ["ZALO_API_URL", "ZALO_BOT_TOKEN"]) &&
                endpoints.adminInboundUrl === `${baseUrl}/crabline/zalo/inbound` &&
                endpoints.apiRoot === baseUrl &&
                env.ZALO_API_URL === baseUrl &&
                env.ZALO_BOT_TOKEN === value.botToken);
        default:
            return false;
    }
}
function isSuccessfulProbe(value, manifest) {
    if (!isRecord(value)) {
        return false;
    }
    switch (manifest.provider) {
        case "discord":
            return (value.id === manifest.botUserId &&
                value.bot === true &&
                typeof value.username === "string" &&
                value.username.trim().length > 0);
        case "mattermost":
            return (value.id === manifest.botUserId &&
                typeof value.username === "string" &&
                value.username.trim().length > 0 &&
                typeof value.update_at === "number" &&
                Number.isSafeInteger(value.update_at) &&
                value.update_at >= 0);
        case "matrix":
            return value.user_id === manifest.botUserId;
        case "signal":
            return (value.ok === true &&
                typeof value.status === "number" &&
                Number.isInteger(value.status) &&
                value.status >= 200 &&
                value.status < 300);
        case "slack":
            return value.ok === true;
        case "telegram": {
            const result = value.result;
            const tokenBotId = typeof manifest.botToken === "string"
                ? /^([1-9]\d*):/u.exec(manifest.botToken)?.[1]
                : undefined;
            const expectedBotId = tokenBotId === undefined ? undefined : Number(tokenBotId);
            return (value.ok === true &&
                isRecord(result) &&
                typeof result.id === "number" &&
                Number.isSafeInteger(result.id) &&
                result.id > 0 &&
                Number.isSafeInteger(expectedBotId) &&
                result.id === expectedBotId &&
                result.is_bot === true &&
                typeof result.first_name === "string" &&
                result.first_name.length > 0);
        }
        case "whatsapp":
            return value.id === manifest.phoneNumberId;
        case "zalo":
            return value.ok === true && isRecord(value.result) && value.result.id === manifest.botId;
        default:
            return false;
    }
}
function isReadinessSection(value, manifest, manifestPath, requireCurrentFields) {
    if (!isRecord(value) || value.manifestPath !== manifestPath || !isRecord(value.result)) {
        return false;
    }
    const result = value.result;
    return (result.ok === true &&
        result.provider === manifest.provider &&
        isRecord(result.endpoints) &&
        isDeepStrictEqual(result.endpoints, manifest.endpoints) &&
        isSuccessfulProbe(result.probe, manifest) &&
        (!requireCurrentFields || (result.proof === "provider-api-probe" && result.ready === true)));
}
function assertGenerationName(value, field) {
    if (typeof value !== "string" || !GENERATION_NAME_PATTERN.test(value)) {
        throw new Error(`OpenClaw Crabline artifact pointer ${field} is malformed.`);
    }
}
function generationArtifactPath(generation, fileName) {
    return path.join(OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, generation, fileName);
}
function artifactRemovalTombstoneBaseName(name) {
    const originalName = REMOVAL_TOMBSTONE_PATTERN.exec(name)?.[1];
    return originalName !== undefined &&
        (GENERATION_NAME_PATTERN.test(originalName) || STAGING_NAME_PATTERN.test(originalName))
        ? originalName
        : null;
}
function withPublishedRecorderPath(providerReadiness, recorderPath) {
    const result = providerReadiness.result;
    if (!result || typeof result !== "object" || Array.isArray(result)) {
        throw new Error("OpenClaw Crabline provider readiness result is malformed.");
    }
    const publishedResult = {
        ...result,
    };
    if (recorderPath === undefined) {
        delete publishedResult.recorderPath;
    }
    else {
        publishedResult.recorderPath = recorderPath;
    }
    return {
        ...providerReadiness,
        result: publishedResult,
    };
}
function parseArtifactPointer(contents) {
    let parsed;
    try {
        parsed = JSON.parse(contents);
    }
    catch (error) {
        throw new Error("OpenClaw Crabline artifact pointer is malformed.", { cause: error });
    }
    if (!isRecord(parsed)) {
        throw new Error("OpenClaw Crabline artifact pointer is malformed.");
    }
    const value = parsed;
    if (value.version !== 3) {
        throw new Error("OpenClaw Crabline artifact pointer is malformed.");
    }
    assertGenerationName(value.generation, "generation");
    if (value.previousGeneration !== undefined) {
        assertGenerationName(value.previousGeneration, "previousGeneration");
        if (value.previousGeneration === value.generation) {
            throw new Error("OpenClaw Crabline artifact pointer is malformed.");
        }
    }
    const expected = {
        capabilityMatrixPath: generationArtifactPath(value.generation, OPENCLAW_CRABLINE_CHANNEL_CAPABILITY_MATRIX_PATH),
        manifestPath: generationArtifactPath(value.generation, OPENCLAW_CRABLINE_MANIFEST_PATH),
        providerReadinessArtifactPath: generationArtifactPath(value.generation, OPENCLAW_CRABLINE_PROVIDER_READINESS_PATH),
    };
    if (typeof value.capabilityMatrixPath !== "string" ||
        value.capabilityMatrixPath !== expected.capabilityMatrixPath ||
        value.manifestPath !== expected.manifestPath ||
        value.providerReadinessArtifactPath !== expected.providerReadinessArtifactPath) {
        throw new Error("OpenClaw Crabline artifact pointer is malformed.");
    }
    if (value.recorderSnapshotPath !== null && typeof value.recorderSnapshotPath !== "string") {
        throw new Error("OpenClaw Crabline artifact pointer is malformed.");
    }
    if (typeof value.recorderSnapshotPath === "string") {
        const recorderFileName = path.basename(value.recorderSnapshotPath);
        if (!recorderFileName.endsWith(".jsonl") ||
            value.recorderSnapshotPath !== generationArtifactPath(value.generation, recorderFileName)) {
            throw new Error("OpenClaw Crabline artifact pointer is malformed.");
        }
    }
    return {
        capabilityMatrixPath: value.capabilityMatrixPath,
        generation: value.generation,
        ...(value.previousGeneration ? { previousGeneration: value.previousGeneration } : {}),
        manifestPath: value.manifestPath,
        providerReadinessArtifactPath: value.providerReadinessArtifactPath,
        recorderSnapshotPath: value.recorderSnapshotPath,
        version: 3,
    };
}
export async function readOpenClawCrablineArtifactPointer(outputDir) {
    try {
        return parseArtifactPointer(await fs.readFile(path.join(path.resolve(outputDir), OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH), "utf8"));
    }
    catch (error) {
        if (isMissingPathError(error)) {
            return null;
        }
        throw error;
    }
}
async function assertArtifactGenerationExists(outputDir, pointer) {
    const generationDirectory = path.resolve(outputDir, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY, pointer.generation);
    let currentGeneration;
    try {
        currentGeneration = await captureDirectoryIdentity(generationDirectory);
    }
    catch (error) {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.", {
            cause: error,
        });
    }
    const assertGenerationIdentity = async () => {
        try {
            await currentGeneration.assertIdentityAt();
        }
        catch (error) {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.", {
                cause: error,
            });
        }
    };
    for (const artifactPath of [
        pointer.manifestPath,
        pointer.capabilityMatrixPath,
        pointer.providerReadinessArtifactPath,
    ]) {
        await assertGenerationIdentity();
        let stats;
        try {
            stats = await fs.lstat(path.join(outputDir, artifactPath));
        }
        catch (error) {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.", {
                cause: error,
            });
        }
        if (!stats.isFile()) {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
        }
        await assertGenerationIdentity();
    }
    const readArtifactObject = async (artifactPath) => {
        try {
            await assertGenerationIdentity();
            const value = JSON.parse(await fs.readFile(path.join(outputDir, artifactPath), "utf8"));
            await assertGenerationIdentity();
            if (!isRecord(value)) {
                throw new Error("artifact is not an object");
            }
            return value;
        }
        catch (error) {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.", {
                cause: error,
            });
        }
    };
    const readNestedRecorderPath = (value) => {
        const result = value.result;
        const recorderPath = result.recorderPath;
        if (recorderPath !== undefined && typeof recorderPath !== "string") {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
        }
        return recorderPath;
    };
    const manifest = await readArtifactObject(pointer.manifestPath);
    const capabilityMatrix = await readArtifactObject(pointer.capabilityMatrixPath);
    const readiness = await readArtifactObject(pointer.providerReadinessArtifactPath);
    const providerReadiness = readiness.providerReadiness;
    if (!isGeneratedManifest(manifest) ||
        capabilityMatrix.version !== 1 ||
        capabilityMatrix.source !== "openclaw/crabline" ||
        capabilityMatrix.manifestPath !== pointer.manifestPath ||
        capabilityMatrix.channelDriver !== "crabline" ||
        typeof capabilityMatrix.selectedChannel !== "string" ||
        capabilityMatrix.selectedChannel.length === 0 ||
        capabilityMatrix.report === null ||
        typeof capabilityMatrix.report !== "object" ||
        Array.isArray(capabilityMatrix.report) ||
        readiness.version !== 2 ||
        readiness.source !== "openclaw/crabline" ||
        readiness.manifestPath !== pointer.manifestPath ||
        readiness.channelDriver !== "crabline" ||
        readiness.selectedChannel !== capabilityMatrix.selectedChannel ||
        manifest.provider !== readiness.selectedChannel ||
        !isReadinessSection(providerReadiness, manifest, pointer.manifestPath, true)) {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
    }
    const manifestRecorderPath = typeof manifest.recorderPath === "string" ? manifest.recorderPath : undefined;
    const providerReadinessRecorderPath = readNestedRecorderPath(providerReadiness);
    const recorderPaths = [manifestRecorderPath, providerReadinessRecorderPath];
    if (manifest.recorderPath !== undefined && typeof manifest.recorderPath !== "string") {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
    }
    if (pointer.recorderSnapshotPath === null) {
        if (recorderPaths.some((recorderPath) => recorderPath !== undefined)) {
            throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
        }
        return;
    }
    const resolvedRecorderPaths = recorderPaths.map((recorderPath) => recorderPath === undefined ? undefined : path.resolve(outputDir, recorderPath));
    if (resolvedRecorderPaths.some((recorderPath) => recorderPath === undefined || path.dirname(recorderPath) !== generationDirectory) ||
        new Set(resolvedRecorderPaths).size !== 1) {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
    }
    const recorderPath = resolvedRecorderPaths[0];
    if (pointer.recorderSnapshotPath !== null &&
        recorderPath !== path.resolve(outputDir, pointer.recorderSnapshotPath)) {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
    }
    try {
        await assertGenerationIdentity();
        const recorderStats = await fs.lstat(recorderPath, { bigint: true });
        if (recorderStats.isFile() && recorderStats.nlink === 1n) {
            await assertGenerationIdentity();
            return;
        }
    }
    catch (error) {
        throw new Error("OpenClaw Crabline current artifact generation is incomplete.", {
            cause: error,
        });
    }
    throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
}
async function readValidCurrentArtifactGeneration(outputDir, initialPointer) {
    let pointer = initialPointer;
    let lastValidationError;
    for (let attempt = 0; attempt < CURRENT_GENERATION_READ_ATTEMPTS; attempt += 1) {
        try {
            await assertArtifactGenerationExists(outputDir, pointer);
            lastValidationError = undefined;
        }
        catch (error) {
            lastValidationError = error;
        }
        const currentPointer = await readOpenClawCrablineArtifactPointer(outputDir);
        if (currentPointer === null || isDeepStrictEqual(currentPointer, pointer)) {
            if (lastValidationError !== undefined) {
                throw lastValidationError;
            }
            if (currentPointer === null) {
                throw new Error("OpenClaw Crabline current artifact generation is incomplete.");
            }
            return pointer;
        }
        pointer = currentPointer;
    }
    throw new Error("OpenClaw Crabline current artifact generation changed too frequently to validate.", lastValidationError === undefined ? undefined : { cause: lastValidationError });
}
async function pruneArtifactStore(params) {
    const retainedGenerations = new Set(params.pointer
        ? [params.pointer.generation, params.pointer.previousGeneration].filter((generation) => generation !== undefined)
        : []);
    for (const entry of await fs.readdir(params.store.directoryPath, { withFileTypes: true })) {
        const isAbandonedStaging = entry.isDirectory() && STAGING_NAME_PATTERN.test(entry.name);
        const isObsoleteGeneration = entry.isDirectory() &&
            GENERATION_NAME_PATTERN.test(entry.name) &&
            !retainedGenerations.has(entry.name);
        const removalTombstoneBaseName = entry.isDirectory()
            ? artifactRemovalTombstoneBaseName(entry.name)
            : null;
        const isRemovalTombstone = removalTombstoneBaseName !== null;
        if (!isAbandonedStaging && !isObsoleteGeneration && !isRemovalTombstone) {
            continue;
        }
        await params.lock.assertOwned();
        await params.store.assertIdentityAt();
        const obsolete = await securePrivateDirectory(path.join(params.store.directoryPath, entry.name), params.directoryOptions);
        await removeSecuredPrivateDirectory(obsolete, undefined, removalTombstoneBaseName ?? entry.name);
        await params.store.assertIdentityAt();
    }
}
export async function publishOpenClawCrablineArtifactGeneration(params, dependencies = {}) {
    const providerReadinessArtifactPath = resolveProviderReadinessArtifactPath(params.selection);
    const outputDir = path.resolve(params.outputDir);
    await fs.mkdir(outputDir, { recursive: true });
    const output = await captureDirectoryIdentity(outputDir);
    await output.assertIdentityAt();
    const storePath = path.join(outputDir, OPENCLAW_CRABLINE_ARTIFACT_STORE_DIRECTORY);
    const directoryOptions = {
        ...(dependencies.platform ? { platform: dependencies.platform } : {}),
        ...(dependencies.secureWindowsDirectory
            ? { secureWindowsDirectory: dependencies.secureWindowsDirectory }
            : {}),
        ...(dependencies.syncParent ? { syncParent: dependencies.syncParent } : {}),
    };
    const store = await securePrivateDirectory(storePath, directoryOptions);
    await output.assertIdentityAt();
    await store.assertIdentityAt();
    await params.lock.assertOwned();
    let currentPointer = await readOpenClawCrablineArtifactPointer(outputDir);
    await output.assertIdentityAt();
    await store.assertIdentityAt();
    if (currentPointer) {
        currentPointer = await readValidCurrentArtifactGeneration(outputDir, currentPointer);
        await output.assertIdentityAt();
        await store.assertIdentityAt();
    }
    await pruneArtifactStore({
        directoryOptions,
        lock: params.lock,
        pointer: currentPointer,
        store,
    });
    await output.assertIdentityAt();
    await store.assertIdentityAt();
    const generationId = dependencies.createGenerationId?.() ?? randomUUID();
    const generation = `generation-${generationId}`;
    if (!GENERATION_NAME_PATTERN.test(generation)) {
        throw new Error("OpenClaw Crabline artifact generation id is malformed.");
    }
    const stagingPath = path.join(storePath, `.staging-${generationId}`);
    const generationPath = path.join(storePath, generation);
    const staging = await securePrivateDirectory(stagingPath, directoryOptions);
    await output.assertIdentityAt();
    await store.assertIdentityAt();
    await staging.assertIdentityAt();
    const publishPrivateFile = dependencies.publishPrivateFile ?? publishPrivateFileAtomically;
    const fileOptions = {
        ...(dependencies.platform ? { platform: dependencies.platform } : {}),
        ...(dependencies.secureWindowsFile
            ? { secureWindowsFile: dependencies.secureWindowsFile }
            : {}),
        ...(dependencies.syncParent ? { syncParent: dependencies.syncParent } : {}),
    };
    let installed = false;
    let committed = false;
    let primaryError;
    let published;
    try {
        if (params.recorderSnapshot &&
            (path.basename(params.recorderSnapshot.fileName) !== params.recorderSnapshot.fileName ||
                !params.recorderSnapshot.fileName.endsWith(".jsonl"))) {
            throw new Error("OpenClaw Crabline recorder snapshot filename is malformed.");
        }
        const recorderSnapshotPath = params.recorderSnapshot
            ? generationArtifactPath(generation, params.recorderSnapshot.fileName)
            : undefined;
        const pointer = {
            capabilityMatrixPath: generationArtifactPath(generation, params.selection.capabilityMatrixPath),
            generation,
            manifestPath: generationArtifactPath(generation, OPENCLAW_CRABLINE_MANIFEST_PATH),
            ...(currentPointer ? { previousGeneration: currentPointer.generation } : {}),
            providerReadinessArtifactPath: generationArtifactPath(generation, providerReadinessArtifactPath),
            recorderSnapshotPath: recorderSnapshotPath ?? null,
            version: 3,
        };
        const publishedManifest = recorderSnapshotPath
            ? { ...params.manifest, recorderPath: recorderSnapshotPath }
            : Object.fromEntries(Object.entries(params.manifest).filter(([key]) => key !== "recorderPath"));
        const providerReadinessBase = withPublishedRecorderPath(params.providerReadiness, recorderSnapshotPath);
        const providerReadiness = {
            ...providerReadinessBase,
            manifestPath: pointer.manifestPath,
        };
        const artifactContents = [
            {
                contents: `${JSON.stringify(publishedManifest, null, 2)}\n`,
                fileName: OPENCLAW_CRABLINE_MANIFEST_PATH,
            },
            {
                contents: `${JSON.stringify({
                    version: 1,
                    source: "openclaw/crabline",
                    channelDriver: params.selection.channelDriver,
                    selectedChannel: params.selection.channel,
                    manifestPath: pointer.manifestPath,
                    report: params.capabilityReport,
                }, null, 2)}\n`,
                fileName: params.selection.capabilityMatrixPath,
            },
            {
                contents: `${JSON.stringify({
                    version: 2,
                    source: "openclaw/crabline",
                    channelDriver: params.selection.channelDriver,
                    selectedChannel: params.selection.channel,
                    manifestPath: pointer.manifestPath,
                    providerReadiness,
                }, null, 2)}\n`,
                fileName: providerReadinessArtifactPath,
            },
            ...(params.recorderSnapshot
                ? [
                    {
                        contents: params.recorderSnapshot.contents,
                        fileName: params.recorderSnapshot.fileName,
                    },
                ]
                : []),
        ];
        await params.lock.assertOwned();
        for (const artifact of artifactContents) {
            await output.assertIdentityAt();
            await store.assertIdentityAt();
            await staging.assertIdentityAt();
            await publishPrivateFile(path.join(stagingPath, artifact.fileName), artifact.contents, fileOptions);
            await output.assertIdentityAt();
            await store.assertIdentityAt();
            await staging.assertIdentityAt();
        }
        await params.lock.assertOwned();
        await output.assertIdentityAt();
        await store.assertIdentityAt();
        await fs.rename(stagingPath, generationPath);
        installed = true;
        await (dependencies.syncParent ?? syncParentDirectory)(generationPath, dependencies.platform);
        await output.assertIdentityAt();
        await staging.assertIdentityAt(generationPath);
        await store.assertIdentityAt();
        await dependencies.beforePointerSwitch?.(pointer);
        await output.assertIdentityAt();
        await store.assertIdentityAt();
        await staging.assertIdentityAt(generationPath);
        await assertArtifactGenerationExists(outputDir, pointer);
        await output.assertIdentityAt();
        await store.assertIdentityAt();
        await staging.assertIdentityAt(generationPath);
        await params.lock.commitFileAtomically({
            contents: `${JSON.stringify(pointer, null, 2)}\n`,
            destinationPath: path.join(outputDir, OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH),
            stageDirectory: store.directoryPath,
            stageFile: async (filePath, contents) => {
                await output.assertIdentityAt();
                await store.assertIdentityAt();
                await staging.assertIdentityAt(generationPath);
                await publishPrivateFile(filePath, contents, fileOptions);
                await output.assertIdentityAt();
                await store.assertIdentityAt();
                await staging.assertIdentityAt(generationPath);
            },
        });
        committed = true;
        let warnings;
        try {
            const committedPointer = await readOpenClawCrablineArtifactPointer(outputDir);
            if (!committedPointer) {
                throw new Error("OpenClaw Crabline artifact pointer is missing after publication.");
            }
            await pruneArtifactStore({
                directoryOptions,
                lock: params.lock,
                pointer: committedPointer,
                store,
            });
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            warnings = [`OpenClaw Crabline artifact retention cleanup failed: ${detail}`];
        }
        published = {
            ...pointer,
            pointerPath: OPENCLAW_CRABLINE_ARTIFACT_POINTER_PATH,
            providerReadiness,
            ...(warnings ? { warnings } : {}),
        };
    }
    catch (error) {
        primaryError = error;
    }
    if (!committed) {
        const unpublishedPath = installed ? generationPath : stagingPath;
        let referencedByPointer = false;
        if (installed) {
            try {
                const livePointer = await readOpenClawCrablineArtifactPointer(outputDir);
                referencedByPointer =
                    livePointer?.generation === generation || livePointer?.previousGeneration === generation;
            }
            catch {
                referencedByPointer = true;
            }
        }
        if (!referencedByPointer) {
            try {
                await removeSecuredPrivateDirectory(staging, unpublishedPath);
            }
            catch (cleanupError) {
                if (primaryError !== undefined) {
                    const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
                    const aggregateError = new AggregateError([primaryError, cleanupError], `${primaryMessage} OpenClaw Crabline artifact rollback cleanup also failed.`);
                    aggregateError.cause = primaryError;
                    const primaryCode = primaryError.code;
                    if (primaryCode) {
                        Object.assign(aggregateError, { code: primaryCode });
                    }
                    throw aggregateError;
                }
                throw cleanupError;
            }
        }
    }
    if (primaryError !== undefined) {
        throw primaryError;
    }
    return published;
}
//# sourceMappingURL=artifact-generation.js.map