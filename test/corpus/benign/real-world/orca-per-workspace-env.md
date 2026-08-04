---
name: orca-per-workspace-env
description: >-
  Set up, review, debug, or validate Orca per-workspace environment recipes --
  on-demand, disposable runtimes (cloud sandboxes, VMs, or local) created fresh
  for each workspace. Covers first-time setup (provider prerequisites, the
  reusable base snapshot, the coding-agent auth snapshot, credentials, and
  state), not just the per-workspace lifecycle scripts. Use to stand up
  per-workspace environments, fix an `environmentRecipes` entry in `orca.yaml`,
  scaffold provider lifecycle scripts, or resolve an `orca vm recipe doctor`
  failure.
---

# Per-Workspace Environments

This file is a discovery stub, not the usage guide. The full, version-matched per-workspace
environment reference is served by the `orca` binary itself.

Engage Orca whenever you set up, review, debug, or validate a per-workspace environment
recipe -- the on-demand, disposable runtimes (cloud sandboxes, VMs, or local) created fresh
for each workspace. Orca is a thin wrapper: you guide, detect, and scaffold; you never own
the user's cloud account, billing, images, or credentials, and never spend money without an
explicit user OK.

## Load the full guide

```text
ORCA skills get orca-per-workspace-env
```

## If an older Orca does not recognize `skills get`

```text
ORCA status --json
ORCA vm recipe doctor <recipe-id> --repo-path <repo> --json
```

The doctor command above is the free static check. Never add `--provision` without the
user's explicit approval because it creates provider resources and may spend money.
