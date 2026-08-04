---
name: review-implementing
description: Process and implement code review feedback systematically. Use when user provides reviewer comments, PR feedback, code review notes, or asks to implement suggestions from reviews.
---

# Review Feedback Implementation

Systematically process and implement changes based on code review feedback.

## When to Use

- Provides reviewer comments or feedback
- Pastes PR review notes
- Mentions implementing review suggestions
- Says "address these comments" or "implement feedback"

## Systematic Workflow

### 1. Parse Reviewer Notes

Identify individual feedback items, split numbered lists, extract distinct change requests.

### 2. Create Todo List

Use TodoWrite tool to create actionable tasks. Each feedback item becomes one or more todos.
Mark first task as `in_progress` before starting.

### 3. Implement Changes Systematically

For each todo item:
- Locate relevant code (Grep, Glob, Read)
- Make changes (Edit tool)
- Verify changes
- Mark todo as `completed` immediately after finishing
- Move to next todo (only one `in_progress` at a time)

### 4. Validation

After implementing: run affected tests, check for linting errors (`uv run ruff check`).

## Important Guidelines

- **Always use TodoWrite** for tracking progress
- **Mark todos completed immediately** after each item
- **Only one todo in_progress** at any time
- **Don't batch completions**
- **Run tests** if changes affect tested code
- **Follow CLAUDE.md conventions**
