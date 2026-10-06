#!/usr/bin/env node
// Preflight for the self-change loop: prove the canonical repository is the
// origin and that its credential can actually push, before trusting a land.
import { execFileSync } from "node:child_process";

const CANONICAL = "github.com/wasimmostakim2965-ui/Open-Wai";

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...opts }).trim();
}

function fail(message) {
  console.error(`self-change-loop: ${message}`);
  process.exit(1);
}

let origin;
try {
  origin = git(["remote", "get-url", "origin"]);
} catch {
  fail("no `origin` remote is configured");
}

// Normalize https/ssh and strip any embedded credential before comparing.
const normalized = origin
  .replace(/^git@([^:]+):/, "https://$1/")
  .replace(/^https?:\/\/[^@/]*@/, "https://")
  .replace(/\.git$/, "")
  .toLowerCase();
if (!normalized.endsWith(CANONICAL.toLowerCase())) {
  fail(`origin is "${origin}", not the canonical ${CANONICAL}`);
}

const helper = git(["config", "--get", "credential.helper"]) || "(none)";
console.log(`origin: ${CANONICAL}`);
console.log(`credential.helper: ${helper}`);

// Dry-run the push against the real remote; no objects are uploaded on success.
try {
  const out = execFileSync("git", ["push", "--dry-run", "origin", "HEAD:main"], {
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  console.log(`push auth: OK\n${out.trim()}`);
} catch (error) {
  const detail = (error.stderr || error.message || "").toString().trim();
  fail(`push auth failed — the canonical credential is missing or stale\n${detail}`);
}

console.log("self-change-loop preflight passed");
