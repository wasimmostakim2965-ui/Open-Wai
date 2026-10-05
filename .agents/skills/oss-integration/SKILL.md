---
name: oss-integration
description: Research, evaluate, and integrate an existing open-source library or service into OpenClaw instead of writing it yourself. Use when a task needs a capability that a proven npm/GitHub project likely already provides — search first, judge purpose/activity/license/fit, then adopt it with proper dependency, adapter, test, and attribution hygiene.
---

# OSS Integration

Use this skill whenever a task asks for a capability that is not specific to
OpenClaw's own domain: parsing, retries, rate limiting, diffing, markdown,
crypto helpers, a protocol client, a data structure, a CLI, or a service SDK.

The default is **adopt, then adapt**. Writing a bespoke implementation is the
fallback, and it must be justified against what already exists.

## Rule: search before you write

Do not start a new module for a generic capability until you have searched for a
proven library and recorded why it does or does not fit. "It is only 40 lines"
is not a reason — 40 lines of untested edge cases is the cost, not the line
count.

## Step 1 — Search

Search three places, in order.

1. **This repo first.** The dependency may already be present.
   ```bash
   # Is it already a dependency somewhere?
   grep -rn '"<name>"' package.json packages/*/package.json extensions/*/package.json
   # Is there already an adapter or wrapper for it?
   rg -l '<name>' src packages extensions
   ```
2. **npm registry.** Get the real metadata, not a blog post.
   ```bash
   npm view <pkg> name version license repository.url time.modified dist.unpackedSize dependencies
   npm view <pkg> --json | jq '{version,license,description,homepage,time:.time.modified}'
   ```
3. **GitHub.** Use the API, not the browser, when a `GITHUB_TOKEN` is present.
   ```bash
   gh search repos "<query>" --sort stars --limit 20 \
     --json fullName,description,stargazersCount,updatedAt,license
   gh api repos/<owner>/<repo> --jq \
     '{stars:.stargazers_count,pushed:.pushed_at,license:.license.spdx_id,archived,open_issues:.open_issues_count}'
   ```
   For web research, `tavily_search` and `fetch` are available; prefer a source
   that shows the library's own README or docs.

## Step 2 — Evaluate

Score each candidate against these axes. A candidate must pass the first two.

| Axis           | What to check                                                                 |
| -------------- | ----------------------------------------------------------------------------- |
| Purpose fit    | Does it solve *this* problem, or a superset you would fight?                  |
| Activity       | Last push/`time.modified` within ~12 months; not archived; responsive issues. |
| License        | Compatible with this project's license; no copyleft surprise in a shipped dep.|
| Adoption       | Download count / stars / used by known projects; more than one maintainer.    |
| Surface area   | Dependency count, native builds, install size, transitive supply-chain risk.  |
| Type/ESM fit   | Ships types (or `@types/*`), ESM-first, no global side effects at import.     |
| Alternatives   | At least one competitor compared; note why the winner won.                    |

Reject a candidate when: it is archived, its license is incompatible, it pulls
native toolchains for a pure-logic need, or its API forces a large refactor.

## Step 3 — Decide and record

State the decision before integrating, in the task or a code comment:

- **Adopt** — name, version range, license, and the one-line reason.
- **Adapt** — wrap it behind a small interface so the dependency is swappable.
- **Write** — only when every candidate fails Step 2; say which and why.

Keep the dependency behind an adapter in `packages/` or the owning `src/`
subsystem when the call sites are more than a couple. That is what makes a later
swap cheap.

## Step 4 — Integrate

```bash
# Add to the correct workspace, not the root, when the capability is scoped.
corepack pnpm --filter <workspace> add <pkg>
# Dev-only tooling belongs in devDependencies.
corepack pnpm --filter <workspace> add -D <pkg>
```

Then:

1. **Pin sensibly.** Prefer a caret range; pin exactly only for tools that break
   on minor bumps. Never depend on a floating tag.
2. **Wrap it.** Expose only the functions the subsystem needs; do not re-export
   the whole library. Type the boundary so a swap does not ripple.
3. **Test the real path.** Exercise the dependency through the adapter with real
   inputs (no mocks of the library itself). Cover the edge cases you adopted it
   for — that is the value you bought.
4. **Attribute.** If the license requires it (MIT/BSD notice, Apache NOTICE),
   keep the notice in `THIRD_PARTY_NOTICES` or the package's `LICENSE` chain.
5. **Guard the supply chain.** New runtime dependencies are a security surface.
   Prefer the official registry; do not add install-time lifecycle scripts from
   an unvetted package.

## Step 5 — Verify

Run the repo's gates on the touched workspace:

```bash
corepack pnpm build
corepack pnpm --filter <workspace> test
```

If the integration is a shipped runtime dependency, also confirm the bundle does
not accidentally pull in the library's dev-only or platform-specific files.

## Anti-patterns

- Writing a hand-rolled parser/retry/ratelimit "because it is small".
- Adding a dependency without checking its license and last release.
- Depending on a library and then re-implementing half of it.
- Letting a new dependency leak through the codebase instead of one adapter.
- Vendoring a package by copy-paste instead of a versioned dependency.
