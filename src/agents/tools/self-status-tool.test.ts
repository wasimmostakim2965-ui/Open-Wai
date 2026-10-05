// self_status tests cover the pure identity/update projection and the tool's
// execute path (local probe by default, remote fetch on refresh).
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import type { UpdateCheckResult } from "../../infra/update-check.js";
import { VERSION } from "../../version.js";
import { createSelfStatusTool, summarizeSelfStatus } from "./self-status-tool.js";

const checkUpdateStatusMock = vi.fn();
const getUpdateCheckResultMock = vi.fn();

vi.mock("../../infra/update-check.js", async () => {
  const actual = await vi.importActual<typeof import("../../infra/update-check.js")>(
    "../../infra/update-check.js",
  );
  return {
    ...actual,
    checkUpdateStatus: (...args: unknown[]) => checkUpdateStatusMock(...args),
  };
});

vi.mock("../../commands/status.update.js", async () => {
  const actual = await vi.importActual<typeof import("../../commands/status.update.js")>(
    "../../commands/status.update.js",
  );
  return {
    ...actual,
    getUpdateCheckResult: (...args: unknown[]) => getUpdateCheckResultMock(...args),
  };
});

vi.mock("../../config/config.js", async () => {
  const actual =
    await vi.importActual<typeof import("../../config/config.js")>("../../config/config.js");
  return {
    ...actual,
    getRuntimeConfig: () => ({ update: { channel: "beta" } }) as unknown as OpenClawConfig,
  };
});

function gitUpdate(overrides: Partial<NonNullable<UpdateCheckResult["git"]>> = {}) {
  return {
    root: "/src/openclaw",
    sha: "abc1234",
    tag: null,
    branch: "main",
    upstream: "origin/main",
    dirty: false,
    ahead: 0,
    behind: 0,
    fetchOk: true,
    ...overrides,
  };
}

function updateResult(overrides: Partial<UpdateCheckResult> = {}): UpdateCheckResult {
  return {
    root: "/src/openclaw",
    installKind: "git",
    packageManager: "pnpm",
    ...overrides,
  };
}

describe("self_status summarizeSelfStatus", () => {
  it("reports a source checkout following the dev branch with a pending update", () => {
    const output = summarizeSelfStatus({
      update: updateResult({
        git: gitUpdate({ behind: 3, ahead: 1 }),
      }),
      buildId: "build-7",
      commit: "abc1234",
    });

    expect(output.name).toBe("openclaw");
    expect(output.version).toBe(VERSION);
    expect(output.buildId).toBe("build-7");
    expect(output.commit).toBe("abc1234");
    expect(output.installKind).toBe("git");
    expect(output.updateChannel).toBe("dev");
    expect(output.updateChannelSource).toBe("git-branch");
    expect(output.updateAvailable).toBe(true);
    expect(output.git?.behind).toBe(3);
    expect(output.git?.ahead).toBe(1);
    expect(output.hint).toContain("openclaw update");
  });

  it("keeps a config channel override and reports no update when clean", () => {
    const output = summarizeSelfStatus({
      update: updateResult({ git: gitUpdate({ behind: 0 }) }),
      configChannel: "beta",
      buildId: null,
      commit: null,
    });

    expect(output.updateChannel).toBe("beta");
    expect(output.updateChannelSource).toBe("config");
    expect(output.updateAvailable).toBe(false);
    expect(output.hint).toBeNull();
  });

  it("surfaces a registry update for a package install", () => {
    const output = summarizeSelfStatus({
      update: updateResult({
        installKind: "package",
        packageManager: "npm",
        git: undefined,
        registry: { latestVersion: "9999.0.0", tag: "latest" },
      }),
      buildId: null,
      commit: null,
    });

    expect(output.installKind).toBe("package");
    expect(output.updateChannel).toBe("stable");
    expect(output.updateChannelSource).toBe("default");
    expect(output.updateAvailable).toBe(true);
    expect(output.registry?.latestVersion).toBe("9999.0.0");
    expect(output.git).toBeUndefined();
  });

  it("passes through an update error and reports no availability", () => {
    const output = summarizeSelfStatus({
      update: updateResult({
        installKind: "unknown",
        packageManager: "unknown",
        error: { status: "failed", message: "git unavailable" },
      }),
      buildId: null,
      commit: null,
    });

    expect(output.error).toEqual({ status: "failed", message: "git unavailable" });
    expect(output.updateAvailable).toBe(false);
    expect(output.hint).toBeNull();
  });
});

describe("self_status execute", () => {
  beforeEach(() => {
    checkUpdateStatusMock.mockReset();
    getUpdateCheckResultMock.mockReset();
  });

  it("defaults to a local probe and reports the running identity", async () => {
    checkUpdateStatusMock.mockResolvedValueOnce(updateResult({ git: gitUpdate({ behind: 2 }) }));

    const result = await createSelfStatusTool().execute("call-1", {});
    const details = result.details as Record<string, unknown>;

    expect(checkUpdateStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({ fetchGit: false, includeRegistry: false }),
    );
    expect(getUpdateCheckResultMock).not.toHaveBeenCalled();
    expect(details.installKind).toBe("git");
    expect(details.updateChannel).toBe("beta");
    expect(details.updateChannelSource).toBe("config");
    expect(details.updateAvailable).toBe(true);
  });

  it("refresh fetches remote state through the update check", async () => {
    getUpdateCheckResultMock.mockResolvedValueOnce(
      updateResult({ git: gitUpdate({ behind: 0, fetchOk: true }) }),
    );

    const result = await createSelfStatusTool().execute("call-1", { refresh: true });
    const details = result.details as Record<string, unknown>;

    expect(getUpdateCheckResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchGit: true,
        includeRegistry: true,
        updateConfigChannel: "beta",
      }),
    );
    expect(checkUpdateStatusMock).not.toHaveBeenCalled();
    expect(details.updateAvailable).toBe(false);
  });
});
