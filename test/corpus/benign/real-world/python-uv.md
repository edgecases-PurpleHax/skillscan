---
name: python-uv
description: Manage Python with uv instead of pip/virtualenv. Use when running Python scripts, installing packages, or creating virtual environments.
version: 1.0.0
---

# Python uv

## Overview

Expert guidance for using **uv** -- the extremely fast Python package and project manager
by Astral. Written in Rust, 10-100x faster than pip. Replaces pip, pip-tools, pipx,
poetry, pyenv, and virtualenv.

## Instructions

### 1. New Project Setup

```bash
uv init my-project
cd my-project
```

### 2. Dependency Management

```bash
uv add requests
uv add --dev pytest ruff mypy
uv sync          # Sync environment with lockfile
uv lock          # Update lockfile
```

### 3. Running Code

```bash
uv run main.py              # Run script (auto-syncs environment)
uv run pytest               # Run command in project environment
uv run --with rich main.py  # Run with extra dependencies
```

**Key insight:** Use `uv run` instead of activating venv. It's faster and ensures sync.

### 4. Python Version Management

```bash
uv python install 3.12
uv python pin 3.12
```

### 5. Tool Management (replaces pipx)

```bash
uvx ruff check .          # Run tool without installing
uv tool install ruff      # Install tool globally
```

## Quick Reference

| Task | Command |
|------|---------|
| New project | `uv init` |
| Add package | `uv add <pkg>` |
| Add dev dep | `uv add --dev <pkg>` |
| Sync env | `uv sync` |
| Run script | `uv run <script.py>` |
| Install Python | `uv python install 3.12` |
| Run tool (no install) | `uvx <tool>` |

## Guidelines

- Use `uv run` instead of activating venv
- Commit `uv.lock` for reproducible builds
- Use `--locked` in CI/CD
- Never mix pip and uv in same project
