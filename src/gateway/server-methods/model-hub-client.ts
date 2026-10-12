// Hugging Face hub client used by the models.hub.* gateway methods.
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolveStateDir } from "../../config/state-dir.js";
import { fetchWithSsrFGuard } from "../../infra/net/fetch-guard.js";
import type { FetchLike } from "../../media/fetch.js";

const HUB_ORIGIN = "https://huggingface.co";
const REQUEST_TIMEOUT_MS = 20_000;
const DOWNLOAD_TIMEOUT_MS = 30 * 60_000;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

export type HubRequestOptions = {
  signal?: AbortSignal;
  /** Transport override; tests inject a stub and production leaves it unset. */
  fetchImpl?: FetchLike;
};

export type HubRepoSummary = {
  id: string;
  author?: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  gated?: boolean;
  pipelineTag?: string;
};

export type HubFile = {
  path: string;
  size?: number;
};

export type HubSpecs = {
  repo: string;
  architecture?: string;
  contextLength?: number;
  parameterCount?: number;
  quantizations: string[];
};

export class ModelHubError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ModelHubError";
  }
}

/** Rejects repository ids that could escape the hub path when interpolated. */
export function normalizeHubRepoId(raw: string): string {
  const id = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!id || id.includes("..") || !/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(id)) {
    throw new ModelHubError(`invalid Hugging Face repository id: ${raw}`);
  }
  return id;
}

function normalizeRevision(raw: string | undefined): string {
  const revision = raw?.trim() || "main";
  if (!/^[A-Za-z0-9._-]+$/.test(revision)) {
    throw new ModelHubError(`invalid Hugging Face revision: ${raw}`);
  }
  return revision;
}

async function hubFetchJson(url: string, options: HubRequestOptions = {}): Promise<unknown> {
  const { response, release } = await fetchWithSsrFGuard({
    url,
    init: { headers: { accept: "application/json" } },
    timeoutMs: REQUEST_TIMEOUT_MS,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  });
  try {
    if (!response.ok) {
      throw new ModelHubError(
        response.status === 401 || response.status === 403
          ? `Hugging Face requires authentication for this repository (HTTP ${response.status})`
          : `Hugging Face request failed (HTTP ${response.status})`,
        response.status,
      );
    }
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new ModelHubError("Hugging Face response exceeded the size limit");
    }
    return JSON.parse(text) as unknown;
  } finally {
    await release();
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function searchHubRepos(
  params: { query?: string; author?: string; sort?: string; limit?: number },
  options: HubRequestOptions = {},
): Promise<{ repos: HubRepoSummary[]; hasMore: boolean }> {
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const url = new URL("/api/models", HUB_ORIGIN);
  url.searchParams.set("filter", "gguf");
  url.searchParams.set("sort", params.sort ?? "downloads");
  url.searchParams.set("direction", "-1");
  // Fetch one extra row so the client can tell whether more results exist.
  url.searchParams.set("limit", String(limit + 1));
  const query = params.query?.trim();
  if (query) {
    url.searchParams.set("search", query);
  }
  const author = params.author?.trim();
  if (author) {
    url.searchParams.set("author", author);
  }
  const payload = await hubFetchJson(url.toString(), options);
  if (!Array.isArray(payload)) {
    throw new ModelHubError("unexpected Hugging Face search response");
  }
  const repos: HubRepoSummary[] = [];
  for (const entry of payload) {
    const row = asRecord(entry);
    const id = asString(row.id) ?? asString(row.modelId);
    if (!id) {
      continue;
    }
    const summary: HubRepoSummary = { id };
    const author = asString(row.author);
    const downloads = asNumber(row.downloads);
    const likes = asNumber(row.likes);
    const lastModified = asString(row.lastModified);
    const pipelineTag = asString(row.pipeline_tag);
    if (author) {
      summary.author = author;
    }
    if (downloads !== undefined) {
      summary.downloads = downloads;
    }
    if (likes !== undefined) {
      summary.likes = likes;
    }
    if (lastModified) {
      summary.lastModified = lastModified;
    }
    if (typeof row.gated === "boolean") {
      summary.gated = row.gated;
    }
    if (pipelineTag) {
      summary.pipelineTag = pipelineTag;
    }
    repos.push(summary);
  }
  return { repos: repos.slice(0, limit), hasMore: repos.length > limit };
}

export async function listHubGgufFiles(
  params: { repo: string; revision?: string },
  options: HubRequestOptions = {},
): Promise<{ repo: string; revision: string; files: HubFile[] }> {
  const repo = normalizeHubRepoId(params.repo);
  const revision = normalizeRevision(params.revision);
  const url = `${HUB_ORIGIN}/api/models/${repo}/tree/${revision}?recursive=true`;
  const payload = await hubFetchJson(url, options);
  if (!Array.isArray(payload)) {
    throw new ModelHubError("unexpected Hugging Face tree response");
  }
  const files: HubFile[] = [];
  for (const entry of payload) {
    const row = asRecord(entry);
    if (asString(row.type) !== "file") {
      continue;
    }
    const path = asString(row.path);
    if (!path || !path.toLowerCase().endsWith(".gguf")) {
      continue;
    }
    const size = asNumber(row.size);
    files.push({ path, ...(size !== undefined ? { size } : {}) });
  }
  files.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  return { repo, revision, files };
}

export async function readHubSpecs(
  params: { repo: string; revision?: string },
  options: HubRequestOptions = {},
): Promise<HubSpecs> {
  const repo = normalizeHubRepoId(params.repo);
  const revision = normalizeRevision(params.revision);
  const url = `${HUB_ORIGIN}/api/models/${repo}/revision/${revision}?expand[]=gguf`;
  const payload = asRecord(await hubFetchJson(url, options));
  const gguf = asRecord(payload.gguf);
  const architecture = asString(gguf.architecture);
  const contextLength = asNumber(gguf.context_length);
  const parameterCount = asNumber(gguf.total);
  const quantizations = Array.isArray(gguf.quantizations)
    ? gguf.quantizations.filter((value): value is string => typeof value === "string")
    : [];
  return {
    repo,
    ...(architecture ? { architecture } : {}),
    ...(contextLength !== undefined ? { contextLength } : {}),
    ...(parameterCount !== undefined ? { parameterCount } : {}),
    quantizations,
  };
}

export type HubDownloadProgress = {
  downloadedBytes: number;
  totalBytes?: number;
};

export type HubDownloadResult = {
  repo: string;
  revision: string;
  file: string;
  path: string;
  sizeBytes: number;
  sha256: string;
  reused: boolean;
};

const GGUF_FILE_MAX_BYTES = 64 * 1024 * 1024 * 1024;

/** Rejects file paths that could escape the cache directory when joined. */
export function normalizeHubFilePath(raw: string): string {
  const file = raw.trim().replace(/^\/+/, "");
  if (
    !file ||
    file.includes("..") ||
    file.includes("\\") ||
    !file.toLowerCase().endsWith(".gguf")
  ) {
    throw new ModelHubError(`invalid Hugging Face GGUF file path: ${raw}`);
  }
  return file;
}

function encodeRepoPath(repo: string): string {
  return repo.split("/").map(encodeURIComponent).join("/");
}

function encodeFilePath(file: string): string {
  return file.split("/").map(encodeURIComponent).join("/");
}

function sha256OfFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Streams one GGUF file from the hub into the local model cache, verifying the
 * server-provided SHA-256 (from the `etag`/`x-linked-etag`, as Hugging Face
 * publishes for LFS files) so a truncated or corrupted download never lands.
 */
export async function downloadHubGgufFile(
  params: { repo: string; file: string; revision?: string },
  options: HubRequestOptions & { onProgress?: (progress: HubDownloadProgress) => void } = {},
): Promise<HubDownloadResult> {
  const repo = normalizeHubRepoId(params.repo);
  const revision = normalizeRevision(params.revision);
  const file = normalizeHubFilePath(params.file);
  const cacheDir = join(resolveStateDir(), "models", "hub", ...repo.split("/"));
  const destination = join(cacheDir, ...file.split("/"));
  await mkdir(dirname(destination), { recursive: true });

  // Resolve the real byte checksum before touching the network file stream; the
  // CDN's own etag is a Xet hash and cannot be compared against SHA-256.
  const lfs = await readHubFileLfs({ repo, revision, file }, options);
  if (lfs.size !== undefined && lfs.size > GGUF_FILE_MAX_BYTES) {
    throw new ModelHubError("Hugging Face file exceeded the download size limit");
  }
  if (lfs.oid && (await fileMatchesSha256(destination, lfs.oid))) {
    const size = (await stat(destination)).size;
    return {
      repo,
      revision,
      file,
      path: destination,
      sizeBytes: size,
      sha256: lfs.oid,
      reused: true,
    };
  }

  const url = `${HUB_ORIGIN}/${encodeRepoPath(repo)}/resolve/${encodeURIComponent(revision)}/${encodeFilePath(file)}?download=true`;
  const partial = `${destination}.partial-${randomUUID()}`;

  const { response, release } = await fetchWithSsrFGuard({
    url,
    init: { headers: { accept: "*/*" } },
    timeoutMs: DOWNLOAD_TIMEOUT_MS,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  });

  let expectedSha256 = lfs.oid;
  let expectedSize = lfs.size;
  try {
    if (!response.ok || !response.body) {
      throw new ModelHubError(
        response.status === 401 || response.status === 403
          ? `Hugging Face requires authentication to download this file (HTTP ${response.status})`
          : `Hugging Face download failed (HTTP ${response.status})`,
        response.status,
      );
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (expectedSize === undefined && Number.isFinite(contentLength) && contentLength > 0) {
      expectedSize = contentLength;
    }
    if (expectedSize !== undefined && expectedSize > GGUF_FILE_MAX_BYTES) {
      throw new ModelHubError("Hugging Face file exceeded the download size limit");
    }

    const handle = await open(partial, "wx", 0o600);
    const hash = createHash("sha256");
    let downloadedBytes = 0;
    try {
      for await (const chunk of response.body.values({ preventCancel: true })) {
        const buffer = Buffer.from(chunk as Uint8Array);
        await handle.write(buffer);
        hash.update(buffer);
        downloadedBytes += buffer.byteLength;
        options.onProgress?.({
          downloadedBytes,
          ...(expectedSize !== undefined ? { totalBytes: expectedSize } : {}),
        });
      }
    } finally {
      await handle.close();
    }
    const sha256 = hash.digest("hex");
    if (expectedSha256 && sha256 !== expectedSha256) {
      throw new ModelHubError(
        `Hugging Face download checksum mismatch (expected ${expectedSha256}, got ${sha256})`,
      );
    }
    if (expectedSize !== undefined && downloadedBytes !== expectedSize) {
      throw new ModelHubError(
        `Hugging Face download was truncated (expected ${expectedSize} bytes, got ${downloadedBytes})`,
      );
    }
    await rename(partial, destination);
    return {
      repo,
      revision,
      file,
      path: destination,
      sizeBytes: downloadedBytes,
      sha256,
      reused: false,
    };
  } finally {
    await rm(partial, { force: true });
    await release();
  }
}

async function fileMatchesSha256(filePath: string, expectedSha256: string): Promise<boolean> {
  if (!(await stat(filePath).catch(() => null))) {
    return false;
  }
  try {
    return (await sha256OfFile(filePath)) === expectedSha256;
  } catch {
    return false;
  }
}

/**
 * Reads the LFS object id (the real SHA-256 of the blob) and size for one file.
 * The CDN's own `etag` is a Xet content hash, not the byte checksum, so the hub
 * API is the only reliable source of the expected digest.
 */
async function readHubFileLfs(
  params: { repo: string; revision: string; file: string },
  options: HubRequestOptions,
): Promise<{ oid?: string; size?: number }> {
  const url = `${HUB_ORIGIN}/api/models/${encodeRepoPath(params.repo)}/paths-info/${encodeURIComponent(params.revision)}`;
  const { response, release } = await fetchWithSsrFGuard({
    url,
    init: {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ paths: [params.file] }),
    },
    timeoutMs: REQUEST_TIMEOUT_MS,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  });
  try {
    if (!response.ok) {
      return {};
    }
    const payload = (await response.json()) as unknown;
    const first = Array.isArray(payload) ? payload[0] : undefined;
    const lfs = asRecord(asRecord(first)?.lfs);
    const oid = asString(lfs.oid);
    const size = asNumber(lfs.size);
    return {
      ...(oid && /^[a-f\d]{64}$/iu.test(oid) ? { oid: oid.toLowerCase() } : {}),
      ...(size !== undefined ? { size } : {}),
    };
  } catch {
    return {};
  } finally {
    await release();
  }
}
