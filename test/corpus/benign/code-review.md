# Code Review

A checklist for reviewing pull requests thoroughly and consistently.

## Type Safety

- Confirm all new functions have explicit parameter and return types.
- Look for unguarded `any` casts — flag them unless a comment explains why they are necessary.
- Verify that nullable values are properly narrowed before use.

## Test Coverage

- Every new function or branch should have at least one corresponding test.
- Check that tests cover the happy path and at least one error case.
- Confirm tests use realistic inputs, not placeholder strings like `"foo"`.

## Naming Conventions

- Variables and functions use camelCase.
- Types and interfaces use PascalCase.
- Constants use UPPER_SNAKE_CASE.
- Names should describe what a thing is or does, not how it is implemented.

## Error Handling

- Functions that can fail should return typed error values or throw typed exceptions — not silently return `undefined`.
- User-facing error messages must not expose internal implementation details (stack traces, query strings, internal service names).
- Log errors server-side with enough context to diagnose the problem.

## Security Considerations

- Check for untrusted input reaching SQL queries without parameterization.
- Verify that user-supplied strings are encoded before being rendered in HTML output.
- Confirm that authentication checks occur before returning any protected resource.
- Look for sensitive values being written to logs.
- Ensure dependencies introduced by the PR do not have known vulnerabilities (run `npm audit`).

## Performance

- Flag N+1 query patterns in database access code.
- Confirm that expensive operations are not called inside loops unnecessarily.

## Readability

- Each function should do one thing.
- Comments should explain *why*, not *what*.
- Remove commented-out code before merging.
