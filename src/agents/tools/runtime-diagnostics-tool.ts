import { Type } from "typebox";
import {
  listActiveDegradedPlugins,
  toPublicPluginVerificationDiagnostic,
  type DegradedPlugin,
} from "../../plugins/runtime-degraded-state.js";
import {
  listActiveDegradedSecretOwners,
  redactSecretDegradationReason,
  type DegradedSecretOwner,
} from "../../secrets/runtime-degraded-state.js";
import { readOpenClawStateWalHealth } from "../../state/openclaw-state-db-cache.js";
import type { SqliteWalHealth } from "../../infra/sqlite-wal-checkpoint.js";
import {
  describeRuntimeDiagnosticsTool,
  RUNTIME_DIAGNOSTICS_TOOL_DISPLAY_SUMMARY,
} from "../tool-description-presets.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

const RuntimeDiagnosticsToolSchema = Type.Object({}, { additionalProperties: false });

const DegradedPluginSchema = Type.Object(
  {
    pluginId: Type.String(),
    state: Type.String(),
    reason: Type.String(),
    detail: Type.String(),
  },
  { additionalProperties: false },
);

const DegradedSecretOwnerSchema = Type.Object(
  {
    ownerKind: Type.String(),
    ownerId: Type.String(),
    state: Type.String(),
    degradationState: Type.Union([Type.String(), Type.Null()]),
    reason: Type.String(),
    refCount: Type.Number(),
    pathCount: Type.Number(),
  },
  { additionalProperties: false },
);

const WalHealthSchema = Type.Object(
  {
    state: Type.String(),
    warning: Type.Boolean(),
    walBytes: Type.Union([Type.Number(), Type.Null()]),
    databaseBytes: Type.Union([Type.Number(), Type.Null()]),
    logFrames: Type.Union([Type.Number(), Type.Null()]),
    checkpointedFrames: Type.Union([Type.Number(), Type.Null()]),
    consecutiveBlocked: Type.Number(),
    observedAtMs: Type.Number(),
    lastCompletedAtMs: Type.Union([Type.Number(), Type.Null()]),
    error: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const RuntimeDiagnosticsOutputSchema = Type.Object(
  {
    healthy: Type.Boolean(),
    issueCount: Type.Number(),
    checkedAtMs: Type.Number(),
    plugins: Type.Object(
      {
        degradedCount: Type.Number(),
        degraded: Type.Array(DegradedPluginSchema),
      },
      { additionalProperties: false },
    ),
    secrets: Type.Object(
      {
        degradedOwnerCount: Type.Number(),
        degradedOwners: Type.Array(DegradedSecretOwnerSchema),
      },
      { additionalProperties: false },
    ),
    state: Type.Object(
      {
        wal: Type.Union([WalHealthSchema, Type.Null()]),
      },
      { additionalProperties: false },
    ),
    hint: Type.Union([Type.String(), Type.Null()]),
  },
  { additionalProperties: false },
);

type RuntimeDiagnosticsOutput = {
  healthy: boolean;
  issueCount: number;
  checkedAtMs: number;
  plugins: {
    degradedCount: number;
    degraded: Array<{ pluginId: string; state: string; reason: string; detail: string }>;
  };
  secrets: {
    degradedOwnerCount: number;
    degradedOwners: Array<{
      ownerKind: string;
      ownerId: string;
      state: string;
      degradationState: string | null;
      reason: string;
      refCount: number;
      pathCount: number;
    }>;
  };
  state: {
    wal: {
      state: string;
      warning: boolean;
      walBytes: number | null;
      databaseBytes: number | null;
      logFrames: number | null;
      checkpointedFrames: number | null;
      consecutiveBlocked: number;
      observedAtMs: number;
      lastCompletedAtMs: number | null;
      error?: string;
    } | null;
  };
  hint: string | null;
};

/**
 * Projects process-local degradation registries and state-DB WAL health into a
 * stable diagnostics snapshot. Pure so the shape can be tested without a live
 * runtime; all secret identity is reduced to counts and redacted reasons.
 */
export function summarizeRuntimeDiagnostics(params: {
  plugins: readonly DegradedPlugin[];
  secretOwners: readonly DegradedSecretOwner[];
  wal: SqliteWalHealth | undefined;
  nowMs?: number;
}): RuntimeDiagnosticsOutput {
  const degradedPlugins = params.plugins.map((plugin) => {
    const diagnostic = toPublicPluginVerificationDiagnostic(plugin.diagnostic);
    return {
      pluginId: plugin.pluginId,
      state: plugin.state,
      reason: diagnostic.reason,
      detail: diagnostic.detail,
    };
  });
  const degradedOwners = params.secretOwners.map((owner) => ({
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    state: owner.state,
    degradationState: owner.degradationState ?? null,
    reason: redactSecretDegradationReason(owner.reason),
    refCount: owner.refKeys.length,
    pathCount: owner.paths.length,
  }));
  const wal = params.wal
    ? {
        state: params.wal.state,
        warning: params.wal.warning,
        walBytes: params.wal.walBytes,
        databaseBytes: params.wal.databaseBytes,
        logFrames: params.wal.logFrames,
        checkpointedFrames: params.wal.checkpointedFrames,
        consecutiveBlocked: params.wal.consecutiveBlocked,
        observedAtMs: params.wal.observedAtMs,
        lastCompletedAtMs: params.wal.lastCompletedAtMs,
        ...(params.wal.error ? { error: params.wal.error } : {}),
      }
    : null;

  const issueCount = degradedPlugins.length + degradedOwners.length + (wal?.warning ? 1 : 0);
  const healthy = issueCount === 0;
  return {
    healthy,
    issueCount,
    checkedAtMs: params.nowMs ?? Date.now(),
    plugins: { degradedCount: degradedPlugins.length, degraded: degradedPlugins },
    secrets: { degradedOwnerCount: degradedOwners.length, degradedOwners },
    state: { wal },
    hint: healthy
      ? null
      : "Inspect the listed degraded plugins, secret owners, or state-database WAL warning before continuing.",
  };
}

/** Reads process-local degradation state and the state-DB WAL health snapshot. */
export function collectRuntimeDiagnostics(nowMs?: number): RuntimeDiagnosticsOutput {
  return summarizeRuntimeDiagnostics({
    plugins: listActiveDegradedPlugins(),
    secretOwners: listActiveDegradedSecretOwners(),
    wal: readOpenClawStateWalHealth(),
    nowMs,
  });
}

/** Reports the agent's own runtime health: degraded plugins, secrets, and WAL state. */
export function createRuntimeDiagnosticsTool(): AnyAgentTool {
  return {
    label: "Runtime Diagnostics",
    name: "runtime_diagnostics",
    description: describeRuntimeDiagnosticsTool(),
    displaySummary: RUNTIME_DIAGNOSTICS_TOOL_DISPLAY_SUMMARY,
    parameters: RuntimeDiagnosticsToolSchema,
    outputSchema: RuntimeDiagnosticsOutputSchema,
    execute: async () => jsonResult(collectRuntimeDiagnostics()),
  };
}
