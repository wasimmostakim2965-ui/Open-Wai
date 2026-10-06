---
name: deep-planning
description: "Decision-quality workflow for any non-trivial task: read to understand, write a plan of atomic steps with a defined verification per step, delegate independent lanes to sub-agents, prove each step with pnpm build + vitest, and reconcile the plan at the end. Use before a new tool, an architecture change, or any multi-file change, and whenever an unfinished plan needs a follow-up."
---

# Deep planning

Decide before you build. A non-trivial task is not started by editing code; it
is started by understanding, planning, proving step by step, and reconciling.
"Done" is a claim you may make only when every plan step is proven.

This skill is the decision-quality half of the self-change rules. It pairs with
the [self-change loop](../self-change-loop/SKILL.md) (how a change lands) and
defers delegation mechanics to the harness's own delegation guidance — the
"Delegation" section injected into the system prompt, backed by
`src/agents/delegation-guidance.ts`.

## When this applies

Any **non-trivial** task:

- a new tool or capability,
- an architecture or owner change,
- a change touching multiple files or contracts.

Trivial work — a typo, a one-line docs fix, a known answer — skips the plan and
is answered or fixed directly.

## The order (mandatory)

1. **Read to understand.** Inspect the real code paths before proposing
   anything: the owner of the behavior, its callers, its tests, and the
   existing mechanism you are expected to reuse. Read, do not infer.
2. **Write the plan.** Produce a plan of **atomic steps**, and for **every**
   step define its **verification** — the exact command or observation that
   proves it. A step without a verification is not a step. Record the plan with
   `progress_card` so it is committed and the harness can hold the turn to it.
3. **Delegate independent lanes.** For independent work, hand it to sub-agents
   per the harness delegation guidance: one lane per independent unit, each
   briefed with objective, output, write scope, and verification. Keep
   coordination in the parent and synthesize child reports.
4. **Prove each step.** As each step lands, run its verification:
   `pnpm build` + the relevant `vitest`. A step is done when its proof is green,
   not when its code is written.
5. **Reconcile the plan.** At the end, walk the plan and mark every step
   completed, or record the concrete blocker that stops it. The plan is the
   source of truth for the claim.

## "Done" means proven

Claim completion only when every plan step has passed its verification. If a
step is unfinished, say so and name the concrete blocker; never invent
completion, and never quietly drop a step.

## Unfinished plans

An unfinished plan must not be abandoned silently. When a follow-up arrives on a
run whose latest saved plan still has pending steps, the harness injects a
plan-completion check and requires the turn to continue or report a concrete
limitation (`openclaw.plan-completion-check`). Work may stop before the plan is
complete **only** when the remaining step is blocked by user input, approval, an
external dependency, or an explicit pause — and that blocker must be stated.
Feasible remaining work continues; completed effects are not repeated; uncertain
effects are reconciled before retrying.
