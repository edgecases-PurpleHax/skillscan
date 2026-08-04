---
name: python-code-style
description: Python code style, linting, formatting, naming conventions, and documentation standards. Use when writing new code, reviewing style, configuring linters, writing docstrings, or establishing project standards.
---

# Python Code Style and Documentation

## When to Use This Skill

- Setting up linting and formatting for a new project
- Writing or reviewing docstrings
- Establishing team coding standards
- Configuring ruff, mypy, or pyright
- Reviewing code for style consistency

## Quick Start

```bash
pip install ruff mypy
```

```toml
# pyproject.toml
[tool.ruff]
line-length = 120
target-version = "py312"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "C4", "UP", "SIM"]
ignore = ["E501"]

[tool.mypy]
strict = true
warn_return_any = true
disallow_untyped_defs = true
```

## Core Concepts

1. **Automated Formatting** -- let tools handle formatting debates
2. **Consistent Naming** -- follow PEP 8 with meaningful, descriptive names
3. **Documentation as Code** -- docstrings maintained alongside code
4. **Type Annotations** -- type hints for all public APIs

## Guidelines

- Use `ruff` as an all-in-one linter and formatter (replaces flake8, isort, black)
- Configure strict type checking for production code
- Commit `uv.lock` for reproducible builds
