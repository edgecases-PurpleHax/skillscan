---
name: git-worktree-workflow
description: Manage git worktrees for branch isolation. Use when creating feature branches, working on isolated tasks, creating PRs, and cleaning up after merge.
version: 1.0.0
---

# Git Worktree Workflow

## Overview

Manage git worktrees for branch isolation within a single Claude session. Worktrees allow
working on a feature branch in a separate directory while keeping the main repo untouched.

## Directory Structure

```
MainProjectDir/
-- ProjectDirApp/      # Main repo (claude runs here)
   -- .claude/        # Claude settings and rules
-- ProjectWorkTree/    # Worktree (isolated branch work)
   -- .claude -> ../ProjectDirApp/.claude  # Symlinked
```

## Workflows

### Phase 1: Create Worktree

```bash
git worktree add ../WorktreeName -b feature/my-feature
ln -s "$(basename $(pwd))"/.claude ../WorktreeName/.claude
git worktree list
```

### Phase 2: Work in Worktree

```bash
# Work on files in ../WorktreeName/
# Commit and push from that directory
cd ../WorktreeName && git add . && git commit -m "message"
cd ../WorktreeName && git push -u origin feature/my-feature
```

### Phase 3: Create PR

```bash
cd ../WorktreeName && gh pr create --base main --head feature/my-feature
```

### Phase 4: After Merge - Cleanup

```bash
git pull origin main
git worktree remove ../WorktreeName
git branch -d feature/my-feature
git worktree list
```

## Guidelines

### Do
- Symlink `.claude/` directory -- never copy
- Use relative paths for symlinks
- Cleanup after PR merge

### Don't
- Copy `.claude/` directory (breaks updates)
- Leave worktrees after merge
- Delete worktree before pushing changes
