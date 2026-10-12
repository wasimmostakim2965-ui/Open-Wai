// Client tests cover URL construction, response shaping, and hub error mapping
// against a stubbed transport (no live network).
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ModelHubError,
  downloadHubGgufFile,
  listHubGgufFiles,
  normalizeHubFilePath,
  normalizeHubRepoId,
  readHubSpecs,
  searchHubRepos,
} from "./model-hub-client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(response: Response) {
  const fetchImpl = vi.fn(async () => response);
  return { fetchImpl: fetchImpl as never, calls: fetchImpl };
}

/** Stubs a sequence of responses for one request each; the last repeats. */
function stubFetchSequence(...responses: Response[]) {
  let index = 0;
  const fetchImpl = vi.fn(
    async () => responses[Math.min(index++, responses.length - 1)] as Response,
  );
  return { fetchImpl: fetchImpl as never, calls: fetchImpl };
}

function pathsInfoResponse(path: string, oid: string, size: number): Response {
  return jsonResponse([{ path, lfs: { oid, size } }]);
}

describe("normalizeHubRepoId", () => {
  it.each([
    ["meta-llama/Llama-3-8B", "meta-llama/Llama-3-8B"],
    ["  Qwen/Qwen2.5  ", "Qwen/Qwen2.5"],
    ["/TheBloke/Mistral-7B-GGUF/", "TheBloke/Mistral-7B-GGUF"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeHubRepoId(input)).toBe(expected);
  });

  it.each(["", "owner", "owner/repo/extra", "owner/..", "a b/c", "owner/repo?x=1"])(
    "rejects %s",
    (input) => {
      expect(() => normalizeHubRepoId(input)).toThrow(ModelHubError);
    },
  );
});

describe("searchHubRepos", () => {
  it("requests GGUF repos sorted by downloads and drops incomplete rows", async () => {
    const { fetchImpl, calls } = stubFetch(
      jsonResponse([
        {
          id: "TheBloke/Mistral-7B-GGUF",
          author: "TheBloke",
          downloads: 42,
          likes: 7,
          lastModified: "2026-01-02T03:04:05.000Z",
          gated: false,
          pipeline_tag: "text-generation",
        },
        { modelId: "org/other-GGUF", downloads: 1 },
        { downloads: 5 },
      ]),
    );
    const result = await searchHubRepos({ query: "mistral" }, { fetchImpl });

    const url = new URL(String(calls.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe("https://huggingface.co/api/models");
    expect(url.searchParams.get("filter")).toBe("gguf");
    expect(url.searchParams.get("sort")).toBe("downloads");
    expect(url.searchParams.get("direction")).toBe("-1");
    expect(url.searchParams.get("search")).toBe("mistral");
    // One extra row is requested to detect further pages.
    expect(url.searchParams.get("limit")).toBe("21");

    expect(result.repos.map((repo) => repo.id)).toEqual([
      "TheBloke/Mistral-7B-GGUF",
      "org/other-GGUF",
    ]);
    expect(result.repos[0]).toMatchObject({
      author: "TheBloke",
      downloads: 42,
      likes: 7,
      gated: false,
      pipelineTag: "text-generation",
    });
    expect(result.hasMore).toBe(false);
  });

  it("reports hasMore when the hub returns more rows than the limit", async () => {
    const rows = Array.from({ length: 4 }, (_, index) => ({ id: `org/model-${index}` }));
    const { fetchImpl } = stubFetch(jsonResponse(rows));
    const result = await searchHubRepos({ limit: 3 }, { fetchImpl });
    expect(result.repos).toHaveLength(3);
    expect(result.hasMore).toBe(true);
  });

  it("maps an auth failure to a gated-repository message", async () => {
    const { fetchImpl } = stubFetch(jsonResponse({ error: "no" }, 403));
    await expect(searchHubRepos({}, { fetchImpl })).rejects.toThrow(/requires authentication/u);
  });

  it("rejects a non-array payload", async () => {
    const { fetchImpl } = stubFetch(jsonResponse({ models: [] }));
    await expect(searchHubRepos({}, { fetchImpl })).rejects.toThrow(/unexpected/u);
  });
});

describe("listHubGgufFiles", () => {
  it("keeps only .gguf files and sorts them largest first", async () => {
    const { fetchImpl, calls } = stubFetch(
      jsonResponse([
        { type: "file", path: "model.Q4_K_M.gguf", size: 100 },
        { type: "directory", path: "sub" },
        { type: "file", path: "README.md", size: 10 },
        { type: "file", path: "model.Q8_0.gguf", size: 900 },
        { type: "file", path: "nested/model.Q2_K.GGUF" },
      ]),
    );
    const result = await listHubGgufFiles({ repo: "org/repo", revision: "v1" }, { fetchImpl });

    const url = String(calls.mock.calls[0]?.[0]);
    expect(url).toBe("https://huggingface.co/api/models/org/repo/tree/v1?recursive=true");
    expect(result).toEqual({
      repo: "org/repo",
      revision: "v1",
      files: [
        { path: "model.Q8_0.gguf", size: 900 },
        { path: "model.Q4_K_M.gguf", size: 100 },
        { path: "nested/model.Q2_K.GGUF" },
      ],
    });
  });

  it("defaults to the main revision and rejects a traversal repo id", async () => {
    const { fetchImpl, calls } = stubFetch(jsonResponse([]));
    await listHubGgufFiles({ repo: "org/repo" }, { fetchImpl });
    expect(String(calls.mock.calls[0]?.[0])).toContain("/tree/main");
    await expect(listHubGgufFiles({ repo: "org/../etc" }, { fetchImpl })).rejects.toThrow(
      ModelHubError,
    );
  });
});

describe("readHubSpecs", () => {
  it("reads GGUF metadata from the expanded revision payload", async () => {
    const { fetchImpl, calls } = stubFetch(
      jsonResponse({
        gguf: {
          architecture: "llama",
          context_length: 8192,
          total: 7_000_000_000,
          quantizations: ["Q4_K_M", "Q8_0", 42],
        },
      }),
    );
    const result = await readHubSpecs({ repo: "org/repo" }, { fetchImpl });

    expect(String(calls.mock.calls[0]?.[0])).toBe(
      "https://huggingface.co/api/models/org/repo/revision/main?expand[]=gguf",
    );
    expect(result).toEqual({
      repo: "org/repo",
      architecture: "llama",
      contextLength: 8192,
      parameterCount: 7_000_000_000,
      quantizations: ["Q4_K_M", "Q8_0"],
    });
  });

  it("returns an empty quantization list for a non-GGUF repository", async () => {
    const { fetchImpl } = stubFetch(jsonResponse({ id: "org/repo" }));
    expect(await readHubSpecs({ repo: "org/repo" }, { fetchImpl })).toEqual({
      repo: "org/repo",
      quantizations: [],
    });
  });
});

describe("normalizeHubFilePath", () => {
  it.each(["model.Q4_K_M.gguf", "sub/model.gguf", "/model.GGUF"])("accepts %s", (input) => {
    expect(normalizeHubFilePath(input)).toBe(input.replace(/^\/+/, ""));
  });

  it.each(["", "model.bin", "../secret.gguf", "a/../../b.gguf", "sub\\model.gguf"])(
    "rejects %s",
    (input) => {
      expect(() => normalizeHubFilePath(input)).toThrow(ModelHubError);
    },
  );
});

describe("downloadHubGgufFile", () => {
  let cacheRoot: string;

  beforeEach(async () => {
    cacheRoot = await mkdtemp(path.join(os.tmpdir(), "hub-download-"));
    process.env.OPENCLAW_STATE_DIR = cacheRoot;
  });

  afterEach(async () => {
    delete process.env.OPENCLAW_STATE_DIR;
    await rm(cacheRoot, { recursive: true, force: true });
  });

  function ggufResponse(body: Buffer, headers: Record<string, string> = {}) {
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
        "content-length": String(body.byteLength),
        ...headers,
      },
    });
  }

  it("streams the file to the cache and verifies the LFS checksum", async () => {
    const body = Buffer.from("GGUFbytes-for-download");
    const sha256 = createHash("sha256").update(body).digest("hex");
    const { fetchImpl, calls } = stubFetchSequence(
      pathsInfoResponse("sub/model.Q4_K_M.gguf", sha256, body.byteLength),
      ggufResponse(body),
    );

    const result = await downloadHubGgufFile(
      { repo: "org/repo", file: "sub/model.Q4_K_M.gguf", revision: "v2" },
      { fetchImpl },
    );

    // First the checksum lookup, then the byte stream.
    expect(String(calls.mock.calls[0]?.[0])).toBe(
      "https://huggingface.co/api/models/org/repo/paths-info/v2",
    );
    expect(String(calls.mock.calls[1]?.[0])).toBe(
      "https://huggingface.co/org/repo/resolve/v2/sub/model.Q4_K_M.gguf?download=true",
    );
    expect(result.reused).toBe(false);
    expect(result.sha256).toBe(sha256);
    expect(result.sizeBytes).toBe(body.byteLength);
    expect(result.path).toBe(
      path.join(cacheRoot, "models", "hub", "org", "repo", "sub", "model.Q4_K_M.gguf"),
    );
    expect(await readFile(result.path)).toEqual(body);
  });

  it("reuses an already-verified download instead of re-fetching", async () => {
    const body = Buffer.from("stable-bytes");
    const sha256 = createHash("sha256").update(body).digest("hex");
    const destination = path.join(cacheRoot, "models", "hub", "org", "repo", "model.gguf");
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, body);
    const { fetchImpl, calls } = stubFetchSequence(
      pathsInfoResponse("model.gguf", sha256, body.byteLength),
    );

    const result = await downloadHubGgufFile(
      { repo: "org/repo", file: "model.gguf" },
      { fetchImpl },
    );

    expect(result.reused).toBe(true);
    expect(result.sha256).toBe(sha256);
    // Only the checksum lookup ran; the byte stream was never opened.
    expect(calls).toHaveBeenCalledTimes(1);
    expect(await readFile(result.path)).toEqual(body);
  });

  it("rejects a download whose bytes do not match the advertised LFS oid", async () => {
    const body = Buffer.from("tampered");
    const wrong = createHash("sha256").update("other").digest("hex");
    const { fetchImpl } = stubFetchSequence(
      pathsInfoResponse("model.gguf", wrong, body.byteLength),
      ggufResponse(body),
    );

    await expect(
      downloadHubGgufFile({ repo: "org/repo", file: "model.gguf" }, { fetchImpl }),
    ).rejects.toThrow(/checksum mismatch/u);
    await expect(
      readFile(path.join(cacheRoot, "models", "hub", "org", "repo", "model.gguf")),
    ).rejects.toThrow();
  });

  it("rejects a truncated download whose size falls short of the LFS size", async () => {
    const body = Buffer.from("short");
    const sha256 = createHash("sha256").update(body).digest("hex");
    const { fetchImpl } = stubFetchSequence(
      pathsInfoResponse("model.gguf", sha256, body.byteLength + 10),
      ggufResponse(body),
    );
    await expect(
      downloadHubGgufFile({ repo: "org/repo", file: "model.gguf" }, { fetchImpl }),
    ).rejects.toThrow(/truncated/u);
  });

  it("maps a 403 to an authentication message and cleans up the partial file", async () => {
    const { fetchImpl } = stubFetchSequence(
      jsonResponse({ error: "no" }, 403),
      new Response("denied", { status: 403 }),
    );
    await expect(
      downloadHubGgufFile({ repo: "org/repo", file: "model.gguf" }, { fetchImpl }),
    ).rejects.toThrow(/requires authentication/u);
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(path.join(cacheRoot, "models", "hub", "org", "repo")).catch(
      () => [] as string[],
    );
    expect(entries.filter((name) => name.includes(".partial-"))).toEqual([]);
  });
});
