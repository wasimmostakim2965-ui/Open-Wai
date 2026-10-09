#!/usr/bin/env node
// Builds a self-contained Windows runtime archive for the desktop shell.
//
// The archive holds a portable Node.js runtime plus the packed OpenClaw package
// with its production dependencies already installed, laid out exactly like an
// npm global prefix:
//
//   node.exe, npm/, npx/            <- portable Node.js
//   openclaw.cmd, openclaw          <- CLI shims (self-relative to node.exe)
//   node_modules/openclaw/...       <- the agent package
//   node_modules/<dependencies>...  <- its production dependencies
//
// The Windows installer unpacks this under `%USERPROFILE%\.openclaw\tools\node-<version>`,
// a location the desktop shell already probes for `openclaw.cmd`, so a fresh
// machine needs no npm, no git, and no network at first launch.
//
// Zip reading and writing are implemented here with `node:zlib` so the builder
// runs identically on Linux and Windows runners (GNU tar cannot read zip).
import { execFileSync } from "node:child_process";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const MIN_NODE_RANGES = [
  { major: 26, floor: [26, 1, 0] },
  { major: 24, floor: [24, 16, 0] },
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = "true";
    }
  }
  return args;
}

function run(command, commandArgs, options = {}) {
  execFileSync(command, commandArgs, { stdio: "inherit", ...options });
}

function parseVersion(version) {
  return version.replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10));
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < 3; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function resolveNodeRelease(requestedVersion) {
  const response = await fetch("https://nodejs.org/dist/index.json");
  if (!response.ok) {
    throw new Error(`Could not read the Node.js release index: HTTP ${response.status}`);
  }
  const index = await response.json();
  const candidates = index.filter((entry) =>
    Array.isArray(entry.files) && entry.files.includes("win-x64-zip"),
  );
  if (requestedVersion) {
    const exact = candidates.find((entry) => entry.version === `v${requestedVersion}`);
    if (!exact) {
      throw new Error(`Node.js v${requestedVersion} is not a published Windows x64 zip release.`);
    }
    return exact;
  }
  for (const range of MIN_NODE_RANGES) {
    const floor = `v${range.floor.join(".")}`;
    const match = candidates
      .filter((entry) => entry.version.startsWith(`v${range.major}.`))
      .filter((entry) => compareVersions(entry.version, floor) >= 0)
      .sort((a, b) => compareVersions(b.version, a.version))[0];
    if (match) return match;
  }
  throw new Error(
    "No Node.js release satisfies the OpenClaw runtime requirement (>=24.16.0 <25 or >=26.1.0).",
  );
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

// --- Minimal, dependency-free zip support -----------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function findEndOfCentralDirectory(buffer) {
  const minimum = Math.max(0, buffer.length - 0x10000 - 22);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("The archive has no zip end-of-central-directory record.");
}

async function extractZip(zipPath, destination) {
  const buffer = await readFile(zipPath);
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("The archive central directory is malformed.");
    }
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    cursor += 46 + nameLength + extraLength + commentLength;

    const target = join(destination, name);
    if (name.endsWith("/")) {
      await mkdir(target, { recursive: true });
      continue;
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : inflateRawSync(compressed);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
  }
}

async function collectFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      // npm writes POSIX bin shims as symlinks; the Windows archive uses real
      // files. Dereference so both layouts package the same content.
      const resolved = entry.isSymbolicLink() ? await stat(entryPath).catch(() => null) : entry;
      if (!resolved) continue;
      if (resolved.isDirectory()) stack.push(entryPath);
      else if (resolved.isFile()) files.push(entryPath);
    }
  }
  return files;
}

async function createZip(sourceDir, zipPath) {
  const files = await collectFiles(sourceDir);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = relative(sourceDir, file).split(sep).join("/");
    const nameBuffer = Buffer.from(name, "utf8");
    const content = await readFile(file);
    const deflated = deflateRawSync(content);
    const useDeflate = deflated.length < content.length;
    const payload = useDeflate ? deflated : content;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    chunks.push(local, nameBuffer, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    central.push(centralHeader, nameBuffer);

    offset += local.length + nameBuffer.length + payload.length;
  }

  const centralBuffer = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  await writeFile(zipPath, Buffer.concat([...chunks, centralBuffer, eocd]));
}

// --- Build ------------------------------------------------------------------

async function directorySize(root) {
  let total = 0;
  for (const file of await collectFiles(root)) total += (await stat(file)).size;
  return total;
}

// npm lays a global prefix out differently per platform:
//   Windows: <prefix>/node_modules + <prefix>/openclaw.cmd
//   POSIX:   <prefix>/lib/node_modules + <prefix>/bin/openclaw
// The shipped archive must use the Windows layout; a POSIX build is only useful
// for exercising the pipeline and is reported as such.
function resolveGlobalLayout(prefix) {
  if (process.platform === "win32") {
    return {
      nodeModules: join(prefix, "node_modules"),
      shim: join(prefix, "openclaw.cmd"),
      windows: true,
    };
  }
  return {
    nodeModules: join(prefix, "lib", "node_modules"),
    shim: join(prefix, "bin", "openclaw"),
    windows: false,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const packageTarball = resolve(args.package ?? join(repoRoot, "openclaw.tgz"));
  const output = resolve(args.out ?? join(repoRoot, "openclaw-runtime.zip"));
  const workDir = args["work-dir"]
    ? resolve(args["work-dir"])
    : await mkdtemp(join(tmpdir(), "openclaw-runtime-"));

  if (!(await stat(packageTarball).catch(() => null))) {
    throw new Error(`Packaged agent tarball not found: ${packageTarball}`);
  }
  await mkdir(workDir, { recursive: true });
  const runtimeDir = join(workDir, "runtime");
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });

  const release = await resolveNodeRelease(args["node-version"]);
  const nodeArchiveName = `node-${release.version}-win-x64.zip`;
  const nodeArchive = join(workDir, nodeArchiveName);
  console.log(`[runtime] Node.js ${release.version} (${nodeArchiveName})`);
  await download(`https://nodejs.org/dist/${release.version}/${nodeArchiveName}`, nodeArchive);
  // The Node.js zip wraps everything in a top-level `node-vX-win-x64/` directory.
  const nodeExtract = join(workDir, "node-extract");
  await rm(nodeExtract, { recursive: true, force: true });
  await extractZip(nodeArchive, nodeExtract);
  const nodeRoot = join(nodeExtract, `node-${release.version}-win-x64`);
  await stat(join(nodeRoot, "node.exe")).catch(() => {
    throw new Error("The extracted Node.js archive does not contain node.exe.");
  });
  await cp(nodeRoot, runtimeDir, { recursive: true });

  const { nodeModules, shim, windows } = resolveGlobalLayout(runtimeDir);
  const openclawDir = join(nodeModules, "openclaw");
  if (!windows) {
    console.warn(
      "[runtime] WARNING: building on a non-Windows host produces a POSIX npm layout, not the shipped Windows layout.",
    );
  }
  console.log("[runtime] Installing the agent and its production dependencies");
  // A global install into an explicit prefix yields the self-relative
  // `openclaw.cmd` shim next to `node.exe`, matching what the shell probes for.
  run(
    "npm",
    [
      "install",
      "--global",
      "--prefix",
      runtimeDir,
      packageTarball,
      // The repo `.npmrc` pins a 7-day release cooldown; the bundled runtime must
      // match the dependency set this package was packed against.
      "--min-release-age=0",
      "--no-audit",
      "--no-fund",
      "--loglevel=error",
    ],
    { cwd: workDir },
  );
  await stat(shim).catch(() => {
    throw new Error(`The runtime is missing the CLI shim (${shim}).`);
  });
  const agentManifest = JSON.parse(
    await readFile(join(openclawDir, "package.json"), "utf8").catch(() => {
      throw new Error("The runtime is missing the installed agent package.");
    }),
  );
  const installedDeps = (await readdir(nodeModules, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && entry.name !== "openclaw" && entry.name !== ".bin",
  );
  if (installedDeps.length < 50) {
    const message = `The runtime only contains ${installedDeps.length} dependencies; the agent's dependency tree did not install.`;
    // The shipped build must prove a full dependency tree; a POSIX pipeline
    // exercise may legitimately use a stub package.
    if (windows) throw new Error(message);
    console.warn(`[runtime] WARNING: ${message}`);
  }
  console.log(`[runtime] Bundled ${installedDeps.length} production dependencies`);

  console.log("[runtime] Writing the self-contained version manifest");
  await writeFile(
    join(runtimeDir, "openclaw-runtime.json"),
    `${JSON.stringify(
      { node: release.version, agent: agentManifest.version, arch: "win-x64" },
      null,
      2,
    )}\n`,
  );

  console.log("[runtime] Packing the runtime archive");
  await rm(output, { force: true });
  await createZip(runtimeDir, output);
  const size = (await stat(output)).size;
  const unpacked = await directorySize(runtimeDir);
  console.log(
    `[runtime] Wrote ${output} (${(size / 1e6).toFixed(1)} MB packed, ${(unpacked / 1e6).toFixed(1)} MB unpacked)`,
  );
  if (workDir.startsWith(tmpdir())) {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[runtime] ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
