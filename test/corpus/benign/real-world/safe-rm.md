---
name: safe-rm
description: Use safe-rm script instead of rm -rf. Prevents accidental deletion of protected system, config, and project paths.
version: 1.0.0
---

# Safe RM

## Overview

Wrapper around destructive delete operations with safety checks. Use this instead of
direct recursive delete commands.

## When to Use

- Deleting directories or files recursively
- Any recursive remove operation
- Cleaning up temporary files/folders

## Usage

```bash
safe-rm /path/to/delete           # Dry-run (default)
safe-rm --force /path/to/delete   # Actually delete
```

## Protected Paths

**System:** `/`, `/bin`, `/boot`, `/dev`, `/etc`, `/lib`, `/opt`, `/proc`, `/root`,
`/sbin`, `/sys`, `/usr`, `/var`, `/home`, `/Users`

**Home config:** `~`, `~/.ssh`, `~/.gnupg`, `~/.config`, `~/.local`, `~/.claude`,
`~/.zshrc`, `~/.bashrc`

**Project:** `.git`, git repository root

## Exit Codes

- `0` -- success (or dry-run completed)
- `1` -- path is protected
- `2` -- path does not exist

## Instructions for Claude

1. **NEVER use direct recursive delete** -- always use `safe-rm` script
2. Run without `--force` first to preview what will be deleted
3. If path is protected, inform user and do not proceed
4. Only use `--force` after confirming dry-run output is correct
