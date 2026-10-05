---
doc-schema-version: 1
summary: "The self_status tool: how an agent reports its own version, install kind, source checkout, update channel, and update availability"
read_when:
  - You want an agent to know whether it runs from a source checkout it can edit
  - You are building self-upgrade or self-modification workflows
  - You need the self_status input and output contract
title: "Self status"
sidebarTitle: "Self status"
---

`self_status` is the core tool an agent calls to learn **its own identity**. It
reports the running install rather than the machine, the workspace, or another
host: version, build id, loaded commit, install kind, package manager, install
root, update channel, and update availability.

This is the foundation for self-upgrade work. Before an agent rewrites its own
source, it must know whether it runs from a source checkout it can edit, and
which update channel it follows.

## When to use it

| Situation                                        | Call                                    |
| ------------------------------------------------ | --------------------------------------- |
| Learn the running version and install kind       | `self_status`                           |
| Decide whether the agent can edit its own source | `self_status` (`installKind`)           |
| Learn which update channel the install follows   | `self_status` (`updateChannel`)         |
| Check whether an update is available             | `self_status` with `refresh: true`      |

## Input

`self_status` takes one optional field:

| Field     | Type    | Default | Meaning                                                                                   |
| --------- | ------- | ------- | ----------------------------------------------------------------------------------------- |
| `refresh` | boolean | `false` | Also fetch remote git/npm state to report update availability. Slower because it uses the network. |

The default call never contacts the network. It reports local identity only,
which is what most self-modification decisions need.

## Output

| Field                 | Meaning                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `name`                | Product name (`openclaw`).                                                      |
| `version`             | Running version (for example `2026.9.7`).                                       |
| `buildId`             | Build id from build info, when the install records one.                         |
| `commit`              | Loaded commit hash for the running process, when known.                         |
| `installKind`         | `git` (source checkout), `package`, `host` (app-owned), or `unknown`.           |
| `installOwner`        | App owner when a package marker names one (for example `macos-app`).            |
| `packageManager`      | Owning package manager (`npm`, `pnpm`, `bun`, or `unknown`).                    |
| `root`                | Resolved install root path.                                                     |
| `updateChannel`       | Effective channel: `stable`, `extended-stable`, `beta`, or `dev`.               |
| `updateChannelSource` | Evidence that decided the channel: `config`, `git-tag`, `git-branch`, `installed-version`, or `default`. |
| `updateAvailable`     | Whether an update is available. `false` without `refresh` unless already known. |
| `git`                 | Branch, sha, tag, upstream, ahead/behind counts, dirty, and fetch status.        |
| `registry`            | Latest registry version and tag when `refresh` runs on a package install.       |
| `error`               | Update-check failure status and message, when the probe failed.                 |
| `hint`                | Operator-facing update hint with the exact command to run, when an update exists. |

`git` and `registry` appear only when the corresponding probe produced data.
`error` appears only when a probe failed.

## Source checkout vs package install

`installKind` is the field most self-modification flows branch on:

- `git` — the agent runs from a source checkout. The `git` block reports the
  branch, sha, and whether the worktree is dirty, so the agent can decide
  whether it can edit and rebuild its own source.
- `package` — the agent runs from an installed package. Edits belong in the
  owning project and ship through an update, not a local rebuild.
- `host` — an app owns the install (for example the signed macOS app). Update
  the app through its own updater.
- `unknown` — ownership could not be classified; the `error` field explains why.

## Update channels

`updateChannel` follows the same policy as `openclaw update`. A saved
`update.channel` wins; otherwise the channel derives from the installed version
or, for a git install, the checked-out tag or branch. `updateChannelSource`
reports which signal decided it, so a surprising channel is explainable.

Source checkouts and `dev` installs are owner-managed: automatic updates do not
replace them. See [Automatic updates](/install/updating/automatic-updates) for
the per-channel behavior and [How an update runs](/cli/update/how-updates-run)
for the update flow.

## Related

- [Update](/cli/update) — the `openclaw update` command.
- [Updating](/install/updating) — update methods and rollback.
- [Tools overview](/tools/index) — where `self_status` sits in the tool surface.
