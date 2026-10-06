---
name: self-change-loop
description: "The mandatory loop for changing OpenClaw itself: stage a change off main, verify it (build + targeted tests + behavior), only then apply it to the live source, and always push the proven change to the canonical repository. Use before editing OpenClaw's own source, architecture, backend, tooling, or config, and whenever a self-change must be landed or reverted."
---

# Self-change loop

OpenClaw changes itself through one ordered loop. Every step is mandatory; a
self-change is not complete until the last one passes. This skill is the
procedure; `AGENTS.md` ("Canonical source and self-changes") is the hard rule.

## The loop

1. **Stage off main.** Write the change on a throwaway branch or an isolated
   worktree, never directly in the live `main` tree:
   ```bash
   git worktree add -b selfchange/<topic> ../openclaw-selfchange-<topic> main
   cd ../openclaw-selfchange-<topic>
   ```
   A worktree keeps the live checkout untouched. Never switch or mutate a
   checkout another agent, test run, or the Gateway is using.
2. **Verify there.** Install if inputs changed (`pnpm install --frozen-lockfile`),
   then run the gates for the touched contract:
   ```bash
   corepack pnpm build
   corepack pnpm exec vitest run <changed-file>.test.ts ...
   ```
   Exercise the real behavior directly when feasible (run the CLI/flow), not just
   the unit boundary. Docs-only: docs sanity plus `git diff --check`.
3. **Apply to live source only when green.** Bring the verified change into the
   live checkout (`main`) by fast-forward/merge or re-applying the same diff.
   Never hand-edit the live tree with an unverified change.
4. **Push the same change to the canonical repository.** A local-only edit is
   unfinished work, not a finished one:
   ```bash
   git push origin main
   git ls-remote origin refs/heads/main   # confirm the remote ref advanced
   ```
   Never push a red build or a failing relevant test.
5. **On breakage, revert and push.** If the change breaks something, `git revert`
   the offending commit and push the revert. Silence is not an option: a broken
   live tree must be repaired in the same loop.

## Report on every push

State, in chat: **what changed | files | tests run and result | commit sha**.

## Worked example

```bash
# 1. stage
git worktree add -b selfchange/runtime-diag ../openclaw-selfchange-runtime-diag main
cd ../openclaw-selfchange-runtime-diag

# 2. verify
corepack pnpm build
corepack pnpm exec vitest run src/agents/tools/runtime-diagnostics-tool.test.ts

# 3. apply (only when green) — here the worktree is the change; merge it home
git commit -am "feat(tools): add runtime_diagnostics"
cd /workspace/project/Open-Wai
git merge --ff-only selfchange/runtime-diag   # or cherry-pick the commit

# 4. push the same change
git push origin main
git ls-remote origin refs/heads/main

# 5. cleanup the throwaway worktree/branch
git worktree remove ../openclaw-selfchange-runtime-diag
git branch -d selfchange/runtime-diag
```

## Guardrails

- **Never** push red tests or a failing build. Never commit secrets.
- Read before you infer; a change that touches an owner follows
  [one owner, complete cutover](../openclaw-pr-maintainer/SKILL.md).
- Keep the live Gateway running on the previous build until the new one is
  proven; see [openclaw-update](../openclaw-update/SKILL.md) for update ownership.
- This loop governs *self*-changes. Ordinary task work in a checkout still
  follows the repo's normal review/CI path.
