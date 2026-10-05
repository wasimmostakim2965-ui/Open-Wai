import { Type } from "typebox";
import {
  getUpdateCheckResult,
  formatUpdateAvailableHint,
  resolveUpdateAvailability,
} from "../../commands/status.update.js";
import { getRuntimeConfig } from "../../config/config.js";
import { resolveOpenClawPackageRoot } from "../../infra/openclaw-root.js";
import {
  normalizeUpdateChannel,
  resolveEffectiveUpdateChannel,
  type UpdateChannel,
  type UpdateChannelSource,
} from "../../infra/update-channels.js";
import { checkUpdateStatus, type UpdateCheckResult } from "../../infra/update-check.js";
import { UPDATE_NETWORK_TIMEOUT_MS } from "../../infra/update-network-budget.js";
import { readSnakeCaseParamRaw } from "../../param-key.js";
import {
  resolveRuntimeServiceBuildId,
  resolveRuntimeServiceCommit,
  VERSION,
} from "../../version.js";
import {
  describeSelfStatusTool,
  SELF_STATUS_TOOL_DISPLAY_SUMMARY,
} from "../tool-description-presets.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

const SELF_STATUS_LOCAL_TIMEOUT_MS = 6000;

const SelfStatusToolSchema = Type.Object(
  {
    refresh: Type.Optional(
      Type.Boolean({
        description:
          "Also fetch remote git/npm state to report whether an update is available. Slower (network). Default false reports local identity only.",
      }),
    ),
  },
  { additionalProperties: false },
);

const SelfStatusGitSchema = Type.Object(
  {
    branch: Type.Union([Type.String(), Type.Null()]),
    sha: Type.Union([Type.String(), Type.Null()]),
    tag: Type.Union([Type.String(), Type.Null()]),
    upstream: Type.Union([Type.String(), Type.Null()]),
    ahead: Type.Union([Type.Number(), Type.Null()]),
    behind: Type.Union([Type.Number(), Type.Null()]),
    dirty: Type.Union([Type.Boolean(), Type.Null()]),
    fetchOk: Type.Union([Type.Boolean(), Type.Null()]),
    stale: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const SelfStatusRegistrySchema = Type.Object(
  {
    latestVersion: Type.Union([Type.String(), Type.Null()]),
    tag: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const SelfStatusOutputSchema = Type.Object(
  {
    name: Type.String(),
    version: Type.String(),
    buildId: Type.Union([Type.String(), Type.Null()]),
    commit: Type.Union([Type.String(), Type.Null()]),
    installKind: Type.String(),
    installOwner: Type.Optional(Type.String()),
    packageManager: Type.String(),
    root: Type.Union([Type.String(), Type.Null()]),
    updateChannel: Type.String(),
    updateChannelSource: Type.String(),
    updateAvailable: Type.Boolean(),
    git: Type.Optional(SelfStatusGitSchema),
    registry: Type.Optional(SelfStatusRegistrySchema),
    error: Type.Optional(
      Type.Object(
        {
          status: Type.String(),
          message: Type.String(),
        },
        { additionalProperties: false },
      ),
    ),
    hint: Type.Union([Type.String(), Type.Null()]),
  },
  { additionalProperties: false },
);

type SelfStatusOutput = {
  name: string;
  version: string;
  buildId: string | null;
  commit: string | null;
  installKind: string;
  installOwner?: string;
  packageManager: string;
  root: string | null;
  updateChannel: UpdateChannel;
  updateChannelSource: UpdateChannelSource;
  updateAvailable: boolean;
  git?: {
    branch: string | null;
    sha: string | null;
    tag: string | null;
    upstream: string | null;
    ahead: number | null;
    behind: number | null;
    dirty: boolean | null;
    fetchOk: boolean | null;
    stale?: string;
  };
  registry?: { latestVersion: string | null; tag?: string };
  error?: { status: string; message: string };
  hint: string | null;
};

/**
 * Projects a raw update check plus loaded build provenance into the stable
 * self_status output. Pure so the shape can be tested without host probing.
 */
export function summarizeSelfStatus(params: {
  update: UpdateCheckResult;
  configChannel?: string | null;
  buildId?: string | null;
  commit?: string | null;
}): SelfStatusOutput {
  const { update } = params;
  const effective = resolveEffectiveUpdateChannel({
    configChannel: normalizeUpdateChannel(params.configChannel),
    currentVersion: VERSION,
    installKind: update.installKind,
    git: update.git ? { tag: update.git.tag, branch: update.git.branch } : undefined,
  });
  const availability = resolveUpdateAvailability(update);
  return {
    name: "openclaw",
    version: VERSION,
    buildId: params.buildId ?? resolveRuntimeServiceBuildId(),
    commit: params.commit ?? resolveRuntimeServiceCommit(),
    installKind: update.installKind,
    ...(update.installOwner ? { installOwner: update.installOwner.owner } : {}),
    packageManager: update.packageManager,
    root: update.root,
    updateChannel: effective.channel,
    updateChannelSource: effective.source,
    updateAvailable: availability.available,
    ...(update.git
      ? {
          git: {
            branch: update.git.branch,
            sha: update.git.sha,
            tag: update.git.tag,
            upstream: update.git.upstream,
            ahead: update.git.ahead,
            behind: update.git.behind,
            dirty: update.git.dirty,
            fetchOk: update.git.fetchOk,
            ...(update.git.stale ? { stale: update.git.stale.reason } : {}),
          },
        }
      : {}),
    ...(update.registry
      ? {
          registry: {
            latestVersion: update.registry.latestVersion,
            ...(update.registry.tag ? { tag: update.registry.tag } : {}),
          },
        }
      : {}),
    ...(update.error
      ? { error: { status: update.error.status, message: update.error.message } }
      : {}),
    hint: formatUpdateAvailableHint(update),
  };
}

/** Collects local install identity and, on refresh, remote update availability. */
export async function collectSelfStatus(params: {
  refresh: boolean;
  configChannel?: string | null;
}): Promise<SelfStatusOutput> {
  const root = await resolveOpenClawPackageRoot({
    moduleUrl: import.meta.url,
    argv1: process.argv[1],
    cwd: process.cwd(),
  });
  const update = params.refresh
    ? await getUpdateCheckResult({
        timeoutMs: UPDATE_NETWORK_TIMEOUT_MS,
        fetchGit: true,
        includeRegistry: true,
        updateConfigChannel: params.configChannel,
      })
    : await checkUpdateStatus({
        root,
        timeoutMs: SELF_STATUS_LOCAL_TIMEOUT_MS,
        fetchGit: false,
        includeRegistry: false,
      }).catch((error: unknown): UpdateCheckResult => ({
        root,
        installKind: "unknown",
        packageManager: "unknown",
        error: { status: "failed", message: String(error) },
      }));
  return summarizeSelfStatus({ update, configChannel: params.configChannel });
}

/** Reports the running install's identity, update channel, and update availability. */
export function createSelfStatusTool(): AnyAgentTool {
  return {
    label: "Self Status",
    name: "self_status",
    description: describeSelfStatusTool(),
    displaySummary: SELF_STATUS_TOOL_DISPLAY_SUMMARY,
    parameters: SelfStatusToolSchema,
    outputSchema: SelfStatusOutputSchema,
    execute: async (_toolCallId, params) => {
      const refresh = readSnakeCaseParamRaw(params as Record<string, unknown>, "refresh") === true;
      const cfg = getRuntimeConfig();
      return jsonResult(await collectSelfStatus({ refresh, configChannel: cfg.update?.channel }));
    },
  };
}
