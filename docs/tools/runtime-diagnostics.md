---
doc-schema-version: 1
summary: "The runtime_diagnostics tool: how an agent reports its own runtime health — degraded plugins, unresolved secret owners, and state-database WAL checkpoint state"
read_when:
  - You want an agent to self-diagnose after a degraded start
  - A credential or plugin may be unavailable and you need the exact reason
  - You need the runtime_diagnostics input and output contract
title: "Runtime diagnostics"
sidebarTitle: "Runtime diagnostics"
---

`runtime_diagnostics` is the core tool an agent calls to learn **its own runtime
health**. It reports the running process rather than the machine or another host:
which configured plugins are quarantined, which SecretRef owners failed to
resolve, and whether the state database's write-ahead log (WAL) is checkpointing.

It reads process-local state only. The default call never contacts the network,
never opens SQLite, and never returns a secret value or reference key.

## When to use it

| Situation                                          | Call                                                       |
| -------------------------------------------------- | ---------------------------------------------------------- |
| A plugin seems missing or disabled after startup   | `runtime_diagnostics` (`plugins`)                          |
| A credential or provider call fails unexpectedly   | `runtime_diagnostics` (`secrets`)                          |
| The state database may be stuck or slow to write   | `runtime_diagnostics` (`state.wal`)                        |
| Confirm the runtime is clean before a risky change | `runtime_diagnostics` (`healthy`)                          |

## Input

`runtime_diagnostics` takes no input fields.

## Output

| Field                       | Meaning                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `healthy`                   | `true` when `issueCount` is `0`.                                            |
| `issueCount`                | Total findings across plugins, secrets, and a warning WAL.                  |
| `checkedAtMs`               | Epoch milliseconds when the snapshot was taken.                             |
| `plugins.degradedCount`     | Number of plugins quarantined for this boot.                                |
| `plugins.degraded[]`        | Per plugin: `pluginId`, `state`, `reason`, and a path-scrubbed `detail`.    |
| `secrets.degradedOwnerCount`| Number of SecretRef owners that could not resolve.                          |
| `secrets.degradedOwners[]`  | Per owner: `ownerKind`, `ownerId`, `state`, `degradationState`, a redacted `reason`, and `refCount`/`pathCount`. |
| `state.wal`                 | WAL checkpoint health, or `null` when no state database handle is open.     |
| `hint`                      | Operator-facing next step when the runtime is not healthy.                  |

### Degraded plugins

A configured plugin whose payload fails verification is quarantined for the
boot instead of loading. `reason` names the failure class (for example
`missing-openclaw-peer-link`), and `detail` is the human message with the
private install root replaced by `<plugin-install>`. See
[Plugin verification](/plugins/verification) for how quarantine is decided.

### Degraded secret owners

A SecretRef owner is listed when cold startup could not materialize its
references. The tool reports only counts and a redacted reason: secret values
and reference keys never leave the process. `degradationState` is `cold` for
owners isolated at startup and `stale` for owners holding a previous value.

### WAL health

`state.wal` reflects the last observation of the state database's WAL
maintenance: `state` is `complete`, `blocked`, or `error`; `warning` is `true`
when checkpointing is degraded. `walBytes`, `logFrames`, `checkpointedFrames`,
and `consecutiveBlocked` explain how far behind the checkpoint is. When no
database handle is open, `state.wal` is `null` rather than an error.

## Related

- [Tools overview](/tools/index) — where `runtime_diagnostics` sits in the tool surface.
- [Self status](/tools/self-status) — the install's own identity and update channel.
- [Plugins](/plugins) — installing and verifying plugins.
- [Secrets](/tools/secrets) — the operator secret store and credential health.
