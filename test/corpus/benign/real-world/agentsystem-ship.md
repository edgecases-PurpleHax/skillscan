---
name: ship
description: The single entry point for the AgentSystem engineering pipeline. Classifies the goal as CREATE / EVOLVE / POLISH / REMOVE / FIX / AUDIT, infers a depth mode (fast|balanced|production), announces the pipeline, then runs the matching bundled workflow playbook. STOPS at code-ready -- never commits, pushes, or opens PRs. Trigger ONLY on explicit invocation.
---

# ship

The user gave you an engineering goal. Pick the right workflow, pick the right depth,
announce both, run the workflow, report. Stop before git.

## Step 1 -- Classify intent

| Phrasing | Intent | Routes to |
|----------|--------|-----------|
| "add", "build", "implement", "create" | CREATE | `add-feature` |
| "update", "extend", "change", "modify" | EVOLVE | `modify-feature` |
| "polish this", "give this a UX pass" | POLISH | `polish-ui` |
| "remove", "delete", "deprecate" | REMOVE | `remove-feature` |
| "broken", "bug", "not working" | FIX | `fix-bug` |
| "audit the codebase", "tech-debt sweep" | AUDIT | `audit` |

**EVOLVE vs POLISH boundary:** EVOLVE is one specific change the user named; POLISH is
"apply the checklist" without a specified change.

**Pre-classification probe:** Before locking a CREATE vs EVOLVE decision, run one quick
Glob/Grep for the named artifact. If it already exists -- almost always EVOLVE.

## Step 2 -- Infer the depth mode

Three modes -- `fast`, `balanced`, `production`.

**High-risk signals (any one triggers `production` mode):** authentication flows,
permission checks, payment processing, external webhooks, schema migrations,
persisted-data rewrites, background jobs, queues, cron tasks, email delivery,
SMS, caching layers, feature flags, multi-subsystem changes.

**Tiny-scope signals (all four required for `fast`):** single file; cosmetic-only;
no data touched; no external service called.

Otherwise -- `balanced`.

## Step 3 -- Announce and run

Announce: the run-id, the pipeline chosen, the depth mode, and any phase overrides.
Then execute the matching playbook inline.

**STOPS at code-ready -- never commits, pushes, or opens PRs.**

Report to the user what was completed and what the next manual step is.
