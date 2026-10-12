/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { GatewayBrowserClient } from "../../api/gateway.ts";
import type { ModelsHubFile, ModelsHubRepoSummary } from "../../api/types.ts";
import type { ApplicationContext } from "../../app/context.ts";
import {
  createApplicationContextProvider,
  createApplicationGateway,
} from "../../test-helpers/application-context.ts";
import { waitForFast } from "../../test-helpers/wait-for.ts";
import { type ModelHubPageTestElement } from "./model-hub-page.test-support.ts";
import "./model-hub-page.ts";

type RequestCall = { method: string; params: unknown };

function createClient(handler: (method: string, params: unknown) => unknown): {
  client: GatewayBrowserClient;
  calls: RequestCall[];
} {
  const calls: RequestCall[] = [];
  const client = {
    request: (method: string, params: unknown) => {
      calls.push({ method, params });
      return Promise.resolve(handler(method, params));
    },
  } as unknown as GatewayBrowserClient;
  return { client, calls };
}

function createHarness(client: GatewayBrowserClient | null) {
  const gatewayHarness = createApplicationGateway({
    client,
    phase: client ? "connected" : "reconnecting",
    offlineStable: false,
    hello: null,
    canvasPluginSurfaceUrl: null,
    assistantAgentId: null,
    sessionKey: "main",
    lastError: null,
    lastErrorCode: null,
  });
  const provider = createApplicationContextProvider({
    gateway: gatewayHarness.gateway,
  } as unknown as ApplicationContext);
  document.body.append(provider);
  const page = document.createElement("openclaw-model-hub-page") as ModelHubPageTestElement;
  provider.append(page);
  return { page, provider };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("model hub page", () => {
  it("searches the hub and lists repository rows", async () => {
    const repos: ModelsHubRepoSummary[] = [
      { id: "TheBloke/Mistral-7B-GGUF", downloads: 1200, likes: 30 },
      { id: "org/second-GGUF", downloads: 5 },
    ];
    const { client, calls } = createClient(() => ({ repos, hasMore: true }));
    const { page } = createHarness(client);

    page.query = "mistral";
    await page.runSearch();
    await waitForFast(() => page.search.phase === "ready");
    await page.updateComplete;

    expect(calls).toEqual([
      { method: "models.hub.search", params: { query: "mistral", limit: 20 } },
    ]);
    expect(page.search).toEqual({ phase: "ready", repos, hasMore: true });
    const ids = [...page.querySelectorAll(".model-hub__repo-id")].map((el) => el.textContent);
    expect(ids).toEqual(["TheBloke/Mistral-7B-GGUF", "org/second-GGUF"]);
  });

  it("loads specs and GGUF files when a repository is selected", async () => {
    const files: ModelsHubFile[] = [
      { path: "model.Q8_0.gguf", size: 900 },
      { path: "model.Q4_K_M.gguf", size: 100 },
    ];
    const { client, calls } = createClient((method) =>
      method === "models.hub.files"
        ? { repo: "org/repo", revision: "main", files }
        : {
            repo: "org/repo",
            architecture: "llama",
            contextLength: 8192,
            quantizations: ["Q8_0"],
          },
    );
    const { page } = createHarness(client);

    await page.selectRepo("org/repo");
    await waitForFast(() => page.files.phase === "ready" && page.specs.phase === "ready");
    await page.updateComplete;

    expect(calls.map((call) => call.method)).toEqual(["models.hub.files", "models.hub.specs"]);
    expect(page.querySelector(".model-hub__file-path")?.textContent).toBe("model.Q8_0.gguf");
    const specs = [...page.querySelectorAll(".model-hub__specs dd")].map((el) => el.textContent);
    expect(specs).toContain("llama");
    expect(specs).toContain("8,192");
  });

  it("surfaces a hub failure as an alert without throwing", async () => {
    const { client } = createClient(() => {
      throw new Error("Hugging Face request failed (HTTP 500)");
    });
    const { page } = createHarness(client);

    await page.runSearch();
    await waitForFast(() => page.search.phase === "error");
    await page.updateComplete;

    expect(page.querySelector('[role="alert"]')?.textContent).toContain("HTTP 500");
  });

  it("reports a missing Gateway client instead of searching", async () => {
    const { page } = createHarness(null);
    await page.runSearch();
    await waitForFast(() => page.search.phase === "error");
    expect(page.search).toMatchObject({ phase: "error" });
  });
});
