---
name: orca-cli
description: >-
  Use the public `orca` CLI to operate Orca-managed worktrees, folder contexts,
  terminals, repos, automations, worktree comments, and the browser embedded
  inside the Orca app. Use when the user says "$orca-cli", "use orca cli",
  "Orca worktree", "child worktree", "cardStatus", "spawn codex/claude in a worktree",
  "read/wait/send Orca terminal", "terminal send", "full handoff", "handover",
  "give this to another agent", "another worktree", "Orca browser", or
  "control the browser inside Orca". Prefer this over raw `git worktree`, ad hoc
  PTYs, Playwright, or Computer Use when the task touches Orca-managed state.
  Use Computer Use for browser windows, webviews, or desktop UI outside Orca's
  embedded browser.
---

# Orca CLI

This file is a discovery stub, not the usage guide. The full, version-matched Orca CLI
reference is served by the `orca` binary itself.

Engage Orca whenever its running editor/runtime is the source of truth: Orca-managed
worktrees, folder contexts, terminals, repos, automations, worktree comments, and the
browser embedded inside the Orca app. Use plain shell tools when Orca state does not matter.

## Load the full guide before running Orca commands

```text
ORCA skills get orca-cli
```

## If an older Orca does not recognize `skills get`

```text
ORCA status --json
ORCA worktree ps --json
ORCA terminal list --json
```
