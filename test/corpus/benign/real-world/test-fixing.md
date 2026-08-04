---
name: test-fixing
description: Run tests and systematically fix all failing tests using smart error grouping. Use when user asks to fix failing tests, mentions test failures, or requests to make tests pass.
---

# Test Fixing

Systematically identify and fix all failing tests using smart grouping strategies.

## When to Use

- Explicitly asks to fix tests ("fix these tests", "make tests pass")
- Reports test failures ("tests are failing", "test suite is broken")
- Mentions CI/CD failures due to tests

## Systematic Approach

### 1. Initial Test Run

Run `make test` to identify all failing tests. Analyze output for error types and patterns.

### 2. Smart Error Grouping

Group similar failures by:
- **Error type**: ImportError, AttributeError, AssertionError, etc.
- **Module/file**: Same file causing multiple test failures
- **Root cause**: Missing dependencies, API changes, refactoring impacts

Prioritize groups by number of affected tests (highest impact first).

### 3. Fix Order Strategy

**Infrastructure first:** Import errors, missing dependencies, configuration issues
**Then API changes:** Function signature changes, module reorganization
**Finally, logic issues:** Assertion failures, business logic bugs

### 4. Final Verification

After all groups fixed: run complete test suite with `make test`, verify no regressions.
