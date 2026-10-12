// Handler tests cover params validation, response forwarding, and error mapping.
import { expectDefined } from "@openclaw/normalization-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayRequestHandlerOptions } from "./types.js";

const mocks = vi.hoisted(() => ({
  searchHubRepos: vi.fn(),
  listHubGgufFiles: vi.fn(),
  readHubSpecs: vi.fn(),
  downloadHubGgufFile: vi.fn(),
}));

vi.mock("./model-hub-client.js", async () => {
  const actual =
    await vi.importActual<typeof import("./model-hub-client.js")>("./model-hub-client.js");
  return { ...actual, ...mocks };
});

import { modelsHubHandlers } from "./model-hub.js";

const search = expectDefined(
  modelsHubHandlers["models.hub.search"],
  'modelsHubHandlers["models.hub.search"] test invariant',
);
const files = expectDefined(
  modelsHubHandlers["models.hub.files"],
  'modelsHubHandlers["models.hub.files"] test invariant',
);
const specs = expectDefined(
  modelsHubHandlers["models.hub.specs"],
  'modelsHubHandlers["models.hub.specs"] test invariant',
);
const download = expectDefined(
  modelsHubHandlers["models.hub.download"],
  'modelsHubHandlers["models.hub.download"] test invariant',
);

function createOptions(method: string, params: Record<string, unknown>) {
  const respond = vi.fn();
  const options = {
    req: { type: "req", id: "hub-1", method, params },
    params,
    client: null,
    isWebchatConnect: () => false,
    respond,
    context: { logGateway: { warn: vi.fn() } } as never,
    signal: new AbortController().signal,
  } as GatewayRequestHandlerOptions;
  return { options, respond };
}

beforeEach(() => {
  mocks.searchHubRepos.mockReset();
  mocks.listHubGgufFiles.mockReset();
  mocks.readHubSpecs.mockReset();
  mocks.downloadHubGgufFile.mockReset();
});

describe("models.hub.search", () => {
  it("forwards the validated params and the caller lifetime to the client", async () => {
    mocks.searchHubRepos.mockResolvedValue({ repos: [{ id: "org/repo" }], hasMore: false });
    const { options, respond } = createOptions("models.hub.search", { query: "llama", limit: 5 });
    await search(options);

    expect(mocks.searchHubRepos).toHaveBeenCalledWith(
      { query: "llama", limit: 5 },
      { signal: options.signal },
    );
    expect(respond).toHaveBeenCalledWith(true, { repos: [{ id: "org/repo" }], hasMore: false });
  });

  it("rejects an out-of-range limit before any network call", async () => {
    const { options, respond } = createOptions("models.hub.search", { limit: 500 });
    await search(options);
    expect(mocks.searchHubRepos).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });

  it("rejects a blank author", async () => {
    const { options, respond } = createOptions("models.hub.search", { author: "   " });
    await search(options);
    expect(mocks.searchHubRepos).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });

  it("reports a client failure as UNAVAILABLE", async () => {
    mocks.searchHubRepos.mockRejectedValue(new Error("hub exploded"));
    const { options, respond } = createOptions("models.hub.search", {});
    await search(options);
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "UNAVAILABLE" }),
    );
  });
});

describe("models.hub.files", () => {
  it("requires a non-blank repo", async () => {
    const { options, respond } = createOptions("models.hub.files", { repo: "   " });
    await files(options);
    expect(mocks.listHubGgufFiles).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });

  it("forwards a valid repo", async () => {
    mocks.listHubGgufFiles.mockResolvedValue({ repo: "org/repo", revision: "main", files: [] });
    const { options, respond } = createOptions("models.hub.files", { repo: "org/repo" });
    await files(options);
    expect(mocks.listHubGgufFiles).toHaveBeenCalledWith(
      { repo: "org/repo" },
      { signal: options.signal },
    );
    expect(respond).toHaveBeenCalledWith(true, { repo: "org/repo", revision: "main", files: [] });
  });
});

describe("models.hub.specs", () => {
  it("forwards a valid repo", async () => {
    mocks.readHubSpecs.mockResolvedValue({ repo: "org/repo", quantizations: ["Q4_K_M"] });
    const { options, respond } = createOptions("models.hub.specs", { repo: "org/repo" });
    await specs(options);
    expect(respond).toHaveBeenCalledWith(true, { repo: "org/repo", quantizations: ["Q4_K_M"] });
  });

  it("rejects a missing repo", async () => {
    const { options, respond } = createOptions("models.hub.specs", {});
    await specs(options);
    expect(mocks.readHubSpecs).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });
});

describe("models.hub.download", () => {
  it("forwards the validated params and the caller lifetime to the client", async () => {
    mocks.downloadHubGgufFile.mockResolvedValue({
      repo: "org/repo",
      revision: "main",
      file: "model.gguf",
      path: "/tmp/model.gguf",
      sizeBytes: 3,
      sha256: "abc",
      reused: false,
    });
    const { options, respond } = createOptions("models.hub.download", {
      repo: "org/repo",
      file: "model.gguf",
    });
    await download(options);
    expect(mocks.downloadHubGgufFile).toHaveBeenCalledWith(
      { repo: "org/repo", file: "model.gguf" },
      { signal: options.signal },
    );
    expect(respond).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ file: "model.gguf", path: "/tmp/model.gguf" }),
    );
  });

  it("rejects a non-GGUF file before any network call", async () => {
    const { options, respond } = createOptions("models.hub.download", {
      repo: "org/repo",
      file: "weights.safetensors",
    });
    await download(options);
    expect(mocks.downloadHubGgufFile).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });

  it("rejects a blank repo and a traversal file", async () => {
    const blank = createOptions("models.hub.download", { repo: "  ", file: "model.gguf" });
    await download(blank.options);
    expect(mocks.downloadHubGgufFile).not.toHaveBeenCalled();
    expect(blank.respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );

    const traversal = createOptions("models.hub.download", { repo: "org/repo", file: "../x.gguf" });
    await download(traversal.options);
    expect(mocks.downloadHubGgufFile).not.toHaveBeenCalled();
    expect(traversal.respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ code: "INVALID_REQUEST" }),
    );
  });
});
