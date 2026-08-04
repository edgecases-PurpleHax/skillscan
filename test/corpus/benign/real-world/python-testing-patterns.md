---
name: python-testing-patterns
description: Implement comprehensive testing strategies with pytest, fixtures, mocking, and test-driven development. Use when writing Python tests, setting up test suites, or implementing testing best practices.
---

# Python Testing Patterns

## When to Use This Skill

- Writing unit tests for Python code
- Setting up test suites and test infrastructure
- Implementing test-driven development (TDD)
- Creating integration tests for APIs and services
- Mocking external dependencies and services
- Debugging failing tests

## Core Concepts

### 1. Test Types
- **Unit Tests**: Test individual functions/classes in isolation
- **Integration Tests**: Test interaction between components
- **Functional Tests**: Test complete features end-to-end
- **Performance Tests**: Measure speed and resource usage

### 2. Test Structure (AAA Pattern)
- **Arrange**: Set up test data and preconditions
- **Act**: Execute the code under test
- **Assert**: Verify the results

### 3. Test Isolation
- Tests should be independent
- No shared state between tests
- Each test should clean up after itself

## Quick Start

```python
def test_add():
    result = add(2, 3)
    assert result == 5
# Run with: pytest test_example.py
```

## Testing Best Practices

- Use fixtures for shared setup
- Mock external services (not internal logic)
- Parameterize tests for multiple inputs
- Aim for meaningful coverage, not just high percentages
- Run tests in CI on every commit
