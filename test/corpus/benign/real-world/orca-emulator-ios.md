---
name: orca-emulator
description: >
  Control a mobile (iOS) emulator / simulator stream from inside Orca using the `orca` CLI.
  Use for taps, gestures, typing, hardware buttons, camera injection, permissions,
  accessibility tree, and more -- all while seeing the live view in Orca's emulator pane.
  Prefer this over raw `npx serve-sim` or direct simctl when running agents inside Orca.
  Complements the orca-cli skill for terminals, worktrees, and the built-in browser.
license: Apache-2.0
---

# Orca Emulator

This file is a discovery stub, not the usage guide. The full, version-matched Orca emulator
reference is served by the `orca` binary itself.

Engage Orca whenever you drive a mobile (iOS) emulator / simulator stream from inside the
Orca app: taps, gestures, typing, hardware buttons, camera injection, runtime permissions,
the accessibility tree, and more. Prefer this over raw `serve-sim` or direct `simctl` when
running agents inside Orca.

## Load the full guide

```text
ORCA skills get orca-emulator
```

## If an older Orca does not recognize `skills get`

```text
ORCA status --json
ORCA emulator list --json
```
