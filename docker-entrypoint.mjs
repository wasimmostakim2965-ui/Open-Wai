// Image activation owns unattended retained-volume repair; ordinary CLI startup only admits state.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCommandOptionsWithRootOptions } from "./cli-root-options.mjs";
import {
  GATEWAY_RUN_BOOLEAN_FLAGS,
  GATEWAY_RUN_VALUE_FLAGS,
  isForegroundGatewayRunArgv,
} from "./gateway-run-argv.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const command = process.argv.slice(2);

function executable(name) {
  const candidates = name.includes(path.sep)
    ? [path.resolve(name)]
    : (process.env.PATH ?? "").split(path.delimiter).map((dir) => path.resolve(dir, name));
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) {
        return fs.realpathSync(candidate);
      }
    } catch {
      // Match normal PATH lookup; exec reports an unavailable command below.
    }
  }
  return undefined;
}

function gatewayInvocation(program) {
  if (!command.length) {
    throw new Error("Docker entrypoint requires a command");
  }
  let argv;
  if (program === fs.realpathSync(process.execPath) && command[1]) {
    let entry;
    try {
      entry = fs.realpathSync(command[1]);
    } catch {
      return undefined;
    }
    if (
      !["openclaw.mjs", "dist/index.js", "dist/entry.js", "dist/entry.mjs"].some(
        (file) => entry === path.join(root, file),
      )
    ) {
      return undefined;
    }
    argv = [process.execPath, entry, ...command.slice(2)];
  } else if (program === path.join(root, "openclaw.mjs")) {
    argv = [process.execPath, program, ...command.slice(1)];
  } else {
    return undefined;
  }
  if (!isForegroundGatewayRunArgv(argv)) {
    return undefined;
  }
  const options = getCommandOptionsWithRootOptions(argv, {
    commandPath: ["gateway"],
    booleanFlags: [...GATEWAY_RUN_BOOLEAN_FLAGS],
    valueFlags: [...GATEWAY_RUN_VALUE_FLAGS],
    mode: "command-path",
  });
  // Reset owns deletion before initialization; do not migrate state it will discard.
  return options && !options.commandOptions.includes("--reset") ? options : undefined;
}

try {
  const program = command[0] && executable(command[0]);
  if (!program) {
    console.error("OpenClaw container activation command was not found");
    process.exit(127);
  }
  const invocation = gatewayInvocation(program);
  if (invocation) {
    let interrupted;
    let child;
    for (const signal of ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"]) {
      process.on(signal, () => {
        interrupted ??= signal;
        // Doctor's maintenance barriers own INT/TERM; HUP/QUIT must use that drain too.
        child?.kill(signal === "SIGHUP" || signal === "SIGQUIT" ? "SIGTERM" : signal);
      });
    }
    // Hosted runtimes (Railway et al.) start this image directly instead of
    // scripts/docker/setup.sh, so nothing pins the local gateway mode. Without
    // it the gateway refuses to start ("existing config is missing gateway.mode").
    // Pin it here, mirroring setup.sh, before doctor and the gateway read config.
    const configPaths = [
      { path: "gateway.mode", value: "local" },
      { path: "gateway.bind", value: process.env.OPENCLAW_GATEWAY_BIND ?? "lan" },
    ];
    // The Control UI shows a token/setup gate when the gateway demands a secret.
    // A hosted image must keep auth (the gateway refuses a lan bind without it),
    // so default to token auth; a trusted single-tenant loopback setup can opt
    // out with OPENCLAW_GATEWAY_AUTH_MODE=none.
    const authMode = process.env.OPENCLAW_GATEWAY_AUTH_MODE ?? "token";
    configPaths.push({ path: "gateway.auth.mode", value: authMode });
    // A hosting platform terminates TLS and forwards the request. The gateway
    // rejects forwarded traffic unless the proxy hop is trusted, so operators
    // declare it here (comma-separated CIDRs) instead of editing config by hand.
    const trustedProxies = process.env.OPENCLAW_TRUSTED_PROXIES;
    if (trustedProxies) {
      configPaths.push({
        path: "gateway.trustedProxies",
        value: trustedProxies
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      });
    }
    // The Control UI refuses browser origins it does not know; hosted UIs sit on
    // the platform domain, not localhost.
    const publicOrigin = process.env.OPENCLAW_PUBLIC_ORIGIN;
    if (publicOrigin) {
      configPaths.push({ path: "gateway.controlUi.allowedOrigins", value: [publicOrigin] });
    }
    const configBatch = JSON.stringify(configPaths);
    await new Promise((resolve) => {
      const configChild = spawn(
        process.execPath,
        [
          path.join(root, "openclaw.mjs"),
          ...invocation.rootOptions,
          "config",
          "set",
          "--batch-json",
          configBatch,
        ],
        { stdio: "inherit", env: process.env },
      );
      configChild.once("close", resolve);
      configChild.once("error", resolve);
    });
    child = spawn(
      process.execPath,
      [
        path.join(root, "openclaw.mjs"),
        ...invocation.rootOptions,
        "doctor",
        "--fix",
        "--non-interactive",
      ],
      { stdio: "inherit", env: process.env },
    );
    let failure;
    child.on("error", (error) => {
      failure = error;
    });
    const outcome = await new Promise((resolve) =>
      child.once("close", (code, signal) => resolve({ code, signal })),
    );
    if (failure) {
      throw failure;
    }
    const signal = interrupted ?? outcome.signal;
    if (signal || outcome.code !== 0) {
      process.exit(signal ? 128 + os.constants.signals[signal] : (outcome.code ?? 1));
    }
  }
  // Replace the adapter so tini continues to supervise the original command directly.
  process.execve(program, command, process.env);
} catch (error) {
  console.error(
    `OpenClaw container activation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
