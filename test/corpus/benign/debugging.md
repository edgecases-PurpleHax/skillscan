# Debugging

A workflow for diagnosing and resolving bugs systematically.

## Start with the Error Message

Read the full error output before making any changes. Copy the exact error message and stack trace. Identify:
- The exception type
- The file and line number where it was thrown
- The call stack leading to it

## Reproduce the Failure

Confirm you can reproduce the bug consistently before attempting a fix. If it is intermittent, note the conditions under which it occurs (load level, specific input, time of day).

## Check the Logs

Use the Bash tool to inspect application logs:

```bash
tail -n 200 logs/app.log
```

Filter for relevant entries around the time of the failure:

```bash
grep -A 5 "ERROR" logs/app.log
```

## Add Debug Output

Add temporary logging to narrow down where state diverges from expectation:

```ts
console.debug("[debug] user object at validation:", JSON.stringify(user, null, 2));
```

Remove all debug logging before committing. Never log credentials or session identifiers.

## Bisect the Failure

If the bug was introduced in a recent commit, use `git bisect` to find the first bad commit:

```bash
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit-hash>
```

Git will check out commits for you to test. Run `git bisect good` or `git bisect bad` after each test. Finish with `git bisect reset` when done.

## Inspect State with the Debugger

Attach a debugger rather than relying solely on log output for complex state:

```bash
node --inspect-brk dist/server.js
```

Open `chrome://inspect` in Chrome to connect and set breakpoints.

## Verify the Fix

After applying a fix:
1. Confirm the original reproduction case no longer triggers the bug.
2. Run the full test suite to check for regressions.
3. Check edge cases adjacent to the fix.
