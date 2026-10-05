// runtime_diagnostics tests cover the pure health projection and the tool's
// execute path (reads process-local degradation registries and WAL health).
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SqliteWalHealth } from "../../infra/sqlite-wal-checkpoint.js";
import type { DegradedPlugin } from "../../plugins/runtime-degraded-state.js";
import type { DegradedSecretOwner } from "../../secrets/runtime-degraded-state.js";
import {
  createRuntimeDiagnosticsTool,
  summarizeRuntimeDiagnostics,
} from "./runtime-diagnostics-tool.js";

const listDegradedPluginsMock = vi.fn();
const listDegradedSecretOwnersMock = vi.fn();
const readWalHealthMock = vi.fn();

vi.mock("../../plugins/runtime-degraded-state.js", async () => {
  const actual = await vi.importActual<typeof import("../../plugins/runtime-degraded-state.js")>(
    "../../plugins/runtime-degraded-state.js",
  );
  return {
    ...actual,
    listActiveDegradedPlugins: () => listDegradedPluginsMock(),
  };
});

vi.mock("../../secrets/runtime-degraded-state.js", async () => {
  const actual = await vi.importActual<typeof import("../../secrets/runtime-degraded-state.js")>(
    "../../secrets/runtime-degraded-state.js",
  );
  return {
    ...actual,
    listActiveDegradedSecretOwners: () => listDegradedSecretOwnersMock(),
  };
});

vi.mock("../../state/openclaw-state-db-cache.js", () => ({
  readOpenClawStateWalHealth: () => readWalHealthMock(),
}));

function degradedPlugin(overrides: Partial<DegradedPlugin> = {}): DegradedPlugin {
  return {
    pluginId: "workboard",
    state: "configured-unavailable",
    diagnostic: {
      kind: "plugin-verification",
      reason: "missing-openclaw-peer-link",
      detail: 'Plugin declares peerDependency "openclaw", but its host peer link is missing.',
      installPath: "/home/op/.openclaw/plugins/workboard",
    },
    ...overrides,
  };
}

function degradedOwner(overrides: Partial<DegradedSecretOwner> = {}): DegradedSecretOwner {
  return {
    ownerKind: "provider",
    ownerId: "openai",
    state: "unavailable",
    degradationState: "cold",
    paths: ["/home/op/.openclaw/secrets.json"],
    refKeys: ["OPENAI_API_KEY", "OPENAI_ORG"],
    reason: "secret provider failed",
    ...overrides,
  };
}

function walHealth(overrides: Partial<SqliteWalHealth> = {}): SqliteWalHealth {
  return {
    state: "complete",
    observedAtMs: 1_700_000_000_000,
    walBytes: 4096,
    databaseBytes: 8192,
    logFrames: 12,
    checkpointedFrames: 12,
    lastCompletedAtMs: 1_700_000_000_000,
    consecutiveBlocked: 0,
    warning: false,
    ...overrides,
  };
}

describe("runtime_diagnostics summarizeRuntimeDiagnostics", () => {
  it("reports healthy when no degradation and a clean WAL", () => {
    const output = summarizeRuntimeDiagnostics({
      plugins: [],
      secretOwners: [],
      wal: walHealth(),
      nowMs: 42,
    });

    expect(output.healthy).toBe(true);
    expect(output.issueCount).toBe(0);
    expect(output.checkedAtMs).toBe(42);
    expect(output.plugins.degradedCount).toBe(0);
    expect(output.secrets.degradedOwnerCount).toBe(0);
    expect(output.state.wal?.state).toBe("complete");
    expect(output.hint).toBeNull();
  });

  it("counts degraded plugins, redacts secret identity, and flags a WAL warning", () => {
    const output = summarizeRuntimeDiagnostics({
      plugins: [degradedPlugin()],
      secretOwners: [degradedOwner()],
      wal: walHealth({ state: "blocked", warning: true, consecutiveBlocked: 4 }),
      nowMs: 1,
    });

    expect(output.healthy).toBe(false);
    expect(output.issueCount).toBe(3);
    expect(output.plugins.degraded[0]?.pluginId).toBe("workboard");
    expect(output.plugins.degraded[0]?.reason).toBe("missing-openclaw-peer-link");
    // The private install root is scrubbed from the public detail.
    expect(output.plugins.degraded[0]?.detail).not.toContain("/home/op");
    // Secret values and reference keys never leave the registry.
    expect(output.secrets.degradedOwners[0]?.refCount).toBe(2);
    expect(output.secrets.degradedOwners[0]?.reason).toBe("secret provider failed");
    expect(JSON.stringify(output)).not.toContain("OPENAI_API_KEY");
    expect(output.state.wal?.warning).toBe(true);
    expect(output.state.wal?.consecutiveBlocked).toBe(4);
    expect(output.hint).toMatch(/degraded plugins/i);
  });

  it("reports a null WAL when no state database handle is open", () => {
    const output = summarizeRuntimeDiagnostics({
      plugins: [],
      secretOwners: [],
      wal: undefined,
      nowMs: 7,
    });

    expect(output.state.wal).toBeNull();
    expect(output.healthy).toBe(true);
  });
});

describe("runtime_diagnostics execute", () => {
  beforeEach(() => {
    listDegradedPluginsMock.mockReset();
    listDegradedSecretOwnersMock.mockReset();
    readWalHealthMock.mockReset();
  });

  it("reads the process-local registries and WAL health", async () => {
    listDegradedPluginsMock.mockReturnValueOnce([degradedPlugin()]);
    listDegradedSecretOwnersMock.mockReturnValueOnce([]);
    readWalHealthMock.mockReturnValueOnce(walHealth());

    const result = await createRuntimeDiagnosticsTool().execute("call-1", {});
    const details = result.details as Record<string, unknown>;

    expect(listDegradedPluginsMock).toHaveBeenCalledTimes(1);
    expect(listDegradedSecretOwnersMock).toHaveBeenCalledTimes(1);
    expect(readWalHealthMock).toHaveBeenCalledTimes(1);
    expect(details.healthy).toBe(false);
    expect(details.issueCount).toBe(1);
    expect((details.plugins as { degradedCount: number }).degradedCount).toBe(1);
  });

  it("reports healthy on a clean process", async () => {
    listDegradedPluginsMock.mockReturnValueOnce([]);
    listDegradedSecretOwnersMock.mockReturnValueOnce([]);
    readWalHealthMock.mockReturnValueOnce(undefined);

    const result = await createRuntimeDiagnosticsTool().execute("call-1", {});
    const details = result.details as Record<string, unknown>;

    expect(details.healthy).toBe(true);
    expect(details.issueCount).toBe(0);
  });
});
