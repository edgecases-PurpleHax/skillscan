# Testing

Guides running the test suite, diagnosing failures, and verifying coverage.

## Running the Full Suite

```bash
npm test
```

Or with Vitest directly:

```bash
npx vitest run
```

## Running a Single Test File

```bash
npx vitest run src/utils/parser.test.ts
```

## Running Tests in Watch Mode

```bash
npx vitest
```

Watch mode re-runs affected tests on file save — useful during active development.

## Interpreting Failures

When a test fails:

1. Read the full error message in the terminal output.
2. Identify whether it is an assertion failure, an import error, or a timeout.
3. Check if the failure is in a test you changed or in an unrelated test (potential regression).
4. Run only the failing test file to isolate it from suite-level noise.

## Checking Coverage

```bash
npx vitest run --coverage
```

The project enforces a minimum line coverage of 80%. Coverage output is written to `coverage/`. Open `coverage/index.html` in a browser to browse the report.

## Fixing Flaky Tests

If a test passes locally but fails in CI:

- Look for timing dependencies or hardcoded timestamps.
- Check for shared mutable state between tests.
- Use `vi.useFakeTimers()` to control time-dependent logic.
- Confirm the test does not depend on execution order.

## Before Committing

Always run the full test suite before opening a pull request. A passing test run locally does not guarantee CI will pass if you have uncommitted file changes.
