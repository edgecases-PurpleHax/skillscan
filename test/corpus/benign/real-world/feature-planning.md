---
name: feature-planning
description: Break down feature requests into detailed, implementable plans with clear tasks. Use when user requests a new feature, enhancement, or complex change.
---

# Feature Planning

Systematically analyze feature requests and create detailed, actionable implementation plans.

## When to Use

- Requests new feature ("add user authentication", "build dashboard")
- Asks for enhancements ("improve performance", "add export")
- Describes complex multi-step changes
- Explicitly asks for planning ("plan how to implement X")

## Planning Workflow

### 1. Understand Requirements

**Ask clarifying questions:**
- What problem does this solve?
- Who are the users?
- Specific technical constraints?
- What does success look like?

**Explore the codebase:**
Use Task tool with `subagent_type='Explore'` and `thoroughness='medium'` to understand
existing architecture and patterns.

### 2. Analyze and Design

**Identify components:**
- Database changes (models, migrations, schemas)
- Backend logic (API endpoints, business logic, services)
- Frontend changes (UI, state, routing)
- Testing requirements

**Consider architecture:**
- Follow existing patterns (check CLAUDE.md)
- Identify reusable components
- Plan error handling and edge cases
- Consider performance implications

### 3. Create Implementation Plan

Break feature into discrete, sequential tasks with file paths and line numbers.

### 4. Execute with plan-implementer

Launch plan-implementer agent for each task sequentially, verify each before next,
let test-fixing skill handle failures.
